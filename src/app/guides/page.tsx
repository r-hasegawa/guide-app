"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebaseConfig";
import { 
  getAllGuideProfiles, 
  getRequestedGuideIds, 
  getUserBasicInfo, 
  GuideProfile 
} from "@/firebase/firestore";

interface GuideWithId extends GuideProfile {
  id: string;
}

export default function GuidesPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [guides, setGuides] = useState<GuideWithId[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<GuideWithId[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [requestedGuideIds, setRequestedGuideIds] = useState<string[]>([]);
  
  // フィルター状態
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  
  // 利用可能な言語とエリアのリスト（重複なし）
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);

  // ガイドデータを取得
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const guidesData = await getAllGuideProfiles();
        
        // 観光客の場合、すでにリクエスト済みのガイドIDを取得
        let requestedIds: string[] = [];
        if (user) {
          const userInfo = await getUserBasicInfo(user.uid);
          if (userInfo?.role === 'guest') {
            requestedIds = await getRequestedGuideIds(user.uid);
            setRequestedGuideIds(requestedIds);
          }
        }
        
        // リクエスト済みガイドを除外
        const filteredGuidesData = guidesData.filter(guide => 
          !requestedIds.includes(guide.id)
        );
        
        setGuides(filteredGuidesData);
        setFilteredGuides(filteredGuidesData);
        
        // 利用可能な言語とエリアを抽出
        const languages = new Set<string>();
        const areas = new Set<string>();
        
        filteredGuidesData.forEach(guide => {
          guide.languages.forEach(lang => languages.add(lang));
          guide.areas.forEach(area => areas.add(area));
        });
        
        setAvailableLanguages(Array.from(languages).sort());
        setAvailableAreas(Array.from(areas).sort());
      } catch (error) {
        console.error("ガイド情報の取得に失敗しました:", error);
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading) {
      fetchGuides();
    }
  }, [user, loading]);

  // フィルター処理
  useEffect(() => {
    let filtered = guides;

    // 言語フィルター
    if (selectedLanguages.length > 0) {
      filtered = filtered.filter(guide =>
        guide.languages.some(lang => selectedLanguages.includes(lang))
      );
    }

    // エリアフィルター
    if (selectedAreas.length > 0) {
      filtered = filtered.filter(guide =>
        guide.areas.some(area => selectedAreas.includes(area))
      );
    }

    setFilteredGuides(filtered);
  }, [guides, selectedLanguages, selectedAreas]);

  // 言語フィルターの切り替え
  const toggleLanguageFilter = (language: string) => {
    setSelectedLanguages(prev =>
      prev.includes(language)
        ? prev.filter(lang => lang !== language)
        : [...prev, language]
    );
  };

  // エリアフィルターの切り替え
  const toggleAreaFilter = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  // フィルターをクリア
  const clearFilters = () => {
    setSelectedLanguages([]);
    setSelectedAreas([]);
  };

  // ガイド詳細ページへ遷移
  const viewGuideDetail = (guideId: string) => {
    router.push(`/guides/${guideId}`);
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">ガイド一覧</h1>
      
      {/* フィルターセクション */}
      <div className="bg-white p-4 rounded-lg mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          {/* 言語フィルター */}
          <div>
            <h3 className="font-semibold mb-2">言語で絞り込み</h3>
            <div className="flex flex-wrap gap-2">
              {availableLanguages.map(language => (
                <button
                  key={language}
                  onClick={() => toggleLanguageFilter(language)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedLanguages.includes(language)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* エリアフィルター */}
          <div>
            <h3 className="font-semibold mb-2">エリアで絞り込み</h3>
            <div className="flex flex-wrap gap-2">
              {availableAreas.map(area => (
                <button
                  key={area}
                  onClick={() => toggleAreaFilter(area)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedAreas.includes(area)
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* フィルタークリアボタン */}
        {(selectedLanguages.length > 0 || selectedAreas.length > 0) && (
          <button
            onClick={clearFilters}
            className="text-red-500 hover:text-red-700 text-sm font-medium"
          >
            フィルターをクリア
          </button>
        )}
      </div>

      {/* 検索結果数 */}
      <p className="mb-4">
        {filteredGuides.length}件のガイドが見つかりました
      </p>

      {/* ガイド一覧 */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-10">
          条件に合うガイドが見つかりませんでした
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGuides.map((guide) => (
            <div
              key={guide.id}
              onClick={() => viewGuideDetail(guide.id)}
              className="p-4 border rounded-lg shadow-sm hover:shadow-md transition cursor-pointer bg-white"
            >
              <h2 className="text-xl font-semibold mb-2">{guide.name}</h2>
              
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">対応言語:</p>
                <div className="flex flex-wrap gap-1">
                  {guide.languages.map(language => (
                    <span
                      key={language}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">対応エリア:</p>
                <div className="flex flex-wrap gap-1">
                  {guide.areas.map(area => (
                    <span
                      key={area}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {guide.introduction && (
                <p className="text-sm text-gray-700 line-clamp-3">
                  {guide.introduction}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}