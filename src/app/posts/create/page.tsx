'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase/firebaseConfig";
import { 
  createGuestPost,
  getGuestProfile,
  getUserBasicInfo
} from "@/firebase/firestore";

export default function CreatePostPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [guestName, setGuestName] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // フォームの状態
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    languages: [] as string[], // preferredLanguages から languages に変更
    areas: [] as string[],
    date: "",
    budget: "",
    duration: "" // 追加
  });

  // 言語とエリアの選択肢
  const availableLanguages = ["日本語", "英語", "中国語", "韓国語", "フランス語", "スペイン語", "ドイツ語", "イタリア語"];
  const availableAreas = ["東京", "大阪", "京都", "横浜", "名古屋", "福岡", "札幌", "広島", "仙台", "神戸"];

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        router.push("/auth/login");
        return;
      }

      try {
        // ユーザーが観光客かどうか確認
        const userInfo = await getUserBasicInfo(user.uid);
        if (!userInfo || userInfo.role !== 'guest') {
          router.push("/guides");
          return;
        }

        // 観光客プロフィールを取得
        const guestProfile = await getGuestProfile(user.uid);
        if (guestProfile) {
          setGuestName(guestProfile.name);
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleLanguage = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(lang => lang !== language)
        : [...prev.languages, language]
    }));
  };

  const toggleArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !guestName) {
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      alert("タイトルと詳細は必須項目です。");
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        guestId: user.uid,
        guestName: guestName,
        title: formData.title.trim(),
        description: formData.description.trim(),
        languages: formData.languages,
        areas: formData.areas,
        date: formData.date.trim() || undefined,
        budget: formData.budget.trim() || undefined,
        duration: formData.duration.trim() || undefined,
      };

      await createGuestPost(postData);

      alert("募集を作成しました！");
      router.push("/posts");
    } catch (error) {
      console.error("募集の作成に失敗しました:", error);
      alert("募集の作成に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-500 hover:text-blue-700 flex items-center gap-1 mb-4"
        >
          ← 戻る
        </button>
        <h1 className="text-3xl font-bold">新しい募集を作成</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* タイトル */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            募集タイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="例: 東京観光のガイドを探しています"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* 詳細 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            詳細 *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="どのようなガイドを希望するか、詳しく説明してください"
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* 希望言語 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            希望する言語
          </label>
          <div className="flex flex-wrap gap-2">
            {availableLanguages.map(language => (
              <button
                key={language}
                type="button"
                onClick={() => toggleLanguage(language)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  formData.languages.includes(language)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {language}
              </button>
            ))}
          </div>
        </div>

        {/* 希望エリア */}
        <div>
          <label className="block text-sm font-medium mb-2">
            希望するエリア
          </label>
          <div className="flex flex-wrap gap-2">
            {availableAreas.map(area => (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`px-3 py-2 rounded-lg text-sm transition ${
                  formData.areas.includes(area)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* 希望日時 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-2">
            希望日時（任意）
          </label>
          <input
            type="text"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            placeholder="例: 2024年3月15日 10:00-17:00"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 希望時間 */}
        <div>
          <label htmlFor="duration" className="block text-sm font-medium mb-2">
            希望時間（任意）
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="例: 半日（4時間）、1日（8時間）"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 予算 */}
        <div>
          <label htmlFor="budget" className="block text-sm font-medium mb-2">
            予算（任意）
          </label>
          <input
            type="text"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleInputChange}
            placeholder="例: 10,000円/日"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {submitting ? "作成中..." : "募集を作成"}
          </button>
        </div>
      </form>
    </main>
  );
}