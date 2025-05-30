"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { getGuideProfile, getGuestProfile, GuideProfile, GuestProfile } from "@/firebase/firestore";

export default function ProfileViewPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();

  const [guideProfile, setGuideProfile] = useState<GuideProfile | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !userInfo) return;

      try {
        if (userInfo.role === 'guide') {
          const profile = await getGuideProfile(user.uid);
          if (profile) {
            setGuideProfile(profile);
          } else {
            // プロフィールが存在しない場合は編集ページへ
            router.push("/mypage/profile/edit");
          }
        } else { // userInfo.role === 'guest'
          const profile = await getGuestProfile(user.uid);
          if (profile) {
            setGuestProfile(profile);
          } else {
            // プロフィールが存在しない場合は編集ページへ
            router.push("/mypage/profile/edit");
          }
        }
      } catch (error) {
        console.error("プロフィール読み込みエラー:", error);
        // エラー発生時も編集ページへリダイレクト
        router.push("/mypage/profile/edit");
      } finally {
        setProfileLoading(false);
      }
    };

    if (!loading && user && userInfo) {
      loadProfile();
    }
  }, [user, userInfo, loading, router]);

  if (loading || profileLoading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  // user が存在しない場合や userInfo がまだロードされていない場合は null を返す
  if (!user || !userInfo) {
    return null;
  }

  const isGuide = userInfo.role === 'guide';
  // 型アサーションを追加して、profile の型を明確にする
  const profile = (isGuide ? guideProfile : guestProfile) as (GuideProfile | GuestProfile | null);

  // プロフィールデータがまだロードされていない、または存在しない場合は null を返す
  // (useEffect内でリダイレクト処理が行われるため)
  if (!profile) {
    return null;
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push('/mypage')}
          className="mr-4 text-blue-500 hover:text-blue-700"
        >
          ← 戻る
        </button>
        <h1 className="text-2xl font-bold">
          {isGuide ? 'ガイドプロフィール' : '観光客プロフィール'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">プロフィール詳細</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            {isGuide ? 'ガイド' : '観光客'}
          </span>
        </div>

        <div className="space-y-6">
          {/* 名前 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">名前</h3>
            <p className="text-lg">{profile.name}</p>
          </div>

          {isGuide ? (
            <>
              {/* ガイド専用フィールド */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">話せる言語</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as GuideProfile).languages.map((lang, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">対応エリア</h3>
                <div className="flex flex-wrap gap-2">
                  {/* Assuming 'areas' from GuideProfile maps to 'specialties' or just displays areas */}
                  {(profile as GuideProfile).areas.map((area, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">自己紹介</h3>
                <p className="whitespace-pre-line">{(profile as GuideProfile).introduction}</p>
              </div>
            </>
          ) : (
            <>
              {/* 観光客専用フィールド（オンボーディングで入力された項目のみ表示） */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">話せる言語</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as GuestProfile).languages.map((lang, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">自己紹介</h3>
                <p className="whitespace-pre-line">{(profile as GuestProfile).introduction}</p>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t">
          <button
            onClick={() => router.push("/mypage/profile/edit")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            プロフィールを編集
          </button>
        </div>
      </div>
    </main>
  );
}