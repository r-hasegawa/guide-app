"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { 
  saveGuideProfile, 
  saveGuestProfile, 
  getGuideProfile, 
  getGuestProfile,
  GuideProfile, 
  GuestProfile 
} from "@/firebase/firestore";

export default function ProfileEditPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // ガイド用フォームデータ
  const [guideProfile, setGuideProfile] = useState<GuideProfile>({
    name: "",
    languages: [],
    introduction: "",
    specialties: [],
    availability: "",
    hourlyRate: undefined,
    certifications: []
  });

  // 観光客用フォームデータ
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({
    name: "",
    nativeLanguage: "",
    learningLanguages: [],
    visitPurpose: "",
    interests: [],
    travelDates: {
      startDate: "",
      endDate: ""
    },
    budget: ""
  });

  // 一時入力用
  const [tempInputs, setTempInputs] = useState({
    language: "",
    specialty: "",
    interest: "",
    learningLanguage: "",
    certification: ""
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    if (!loading && user && userInfo && !userInfo.profileCompleted) {
      router.replace("/profile/onboarding");
      return;
    }
  }, [user, userInfo, loading, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !userInfo) return;

      try {
        if (userInfo.role === 'guide') {
          const existing = await getGuideProfile(user.uid);
          if (existing) setGuideProfile(existing);
        } else {
          const existing = await getGuestProfile(user.uid);
          if (existing) setGuestProfile(existing);
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
      }
    };

    if (!loading && user && userInfo) {
      fetchProfile();
    }
  }, [user, userInfo, loading]);

  const handleGuideInputChange = (field: keyof GuideProfile, value: any) => {
    setGuideProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleGuestInputChange = (field: keyof GuestProfile, value: any) => {
    setGuestProfile(prev => ({ ...prev, [field]: value }));
  };

  const addToArray = (profileType: 'guide' | 'guest', field: string, tempField: string) => {
    const value = tempInputs[tempField as keyof typeof tempInputs];
    if (!value.trim()) return;

    if (profileType === 'guide') {
      setGuideProfile(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof GuideProfile] as string[]), value.trim()]
      }));
    } else {
      setGuestProfile(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof GuestProfile] as string[]), value.trim()]
      }));
    }

    setTempInputs(prev => ({ ...prev, [tempField]: "" }));
  };

  const removeFromArray = (profileType: 'guide' | 'guest', field: string, index: number) => {
    if (profileType === 'guide') {
      setGuideProfile(prev => ({
        ...prev,
        [field]: (prev[field as keyof GuideProfile] as string[]).filter((_, i) => i !== index)
      }));
    } else {
      setGuestProfile(prev => ({
        ...prev,
        [field]: (prev[field as keyof GuestProfile] as string[]).filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async () => {
    if (!user || !userInfo) return;

    setIsSubmitting(true);
    setError("");

    try {
      if (userInfo.role === 'guide') {
        await saveGuideProfile(user.uid, guideProfile);
      } else {
        await saveGuestProfile(user.uid, guestProfile);
      }
      router.push("/mypage/profile/view");
    } catch (err) {
      console.error("保存エラー:", err);
      setError("プロフィールの保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !userInfo) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  const isGuide = userInfo.role === 'guide';

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isGuide ? 'ガイドプロフィール編集' : '観光客プロフィール編集'}
      </h1>

      <div className="space-y-6">
        {/* 名前 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={isGuide ? guideProfile.name : guestProfile.name}
            onChange={(e) => isGuide 
              ? handleGuideInputChange('name', e.target.value)
              : handleGuestInputChange('name', e.target.value)
            }
            className="w-full border rounded px-3 py-2"
            placeholder="山田 太郎"
          />
        </div>

        {isGuide ? (
          <>
            {/* ガイド用フィールド */}
            <div>
              <label className="block text-sm font-medium mb-2">
                話せる言語 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tempInputs.language}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, language: e.target.value }))}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="例: 日本語"
                />
                <button
                  type="button"
                  onClick={() => addToArray('guide', 'languages', 'language')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {guideProfile.languages.map((lang, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeFromArray('guide', 'languages', index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                専門分野・得意エリア <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tempInputs.specialty}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, specialty: e.target.value }))}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="例: 浅草・歴史文化"
                />
                <button
                  type="button"
                  onClick={() => addToArray('guide', 'specialties', 'specialty')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {guideProfile.specialties.map((specialty, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeFromArray('guide', 'specialties', index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                自己紹介 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={guideProfile.introduction}
                onChange={(e) => handleGuideInputChange('introduction', e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2"
                placeholder="あなたのガイド経験や特徴を教えてください"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                対応可能時間
              </label>
              <input
                type="text"
                value={guideProfile.availability}
                onChange={(e) => handleGuideInputChange('availability', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="例: 平日 9:00-17:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                希望時給（円）
              </label>
              <input
                type="number"
                value={guideProfile.hourlyRate || ''}
                onChange={(e) => handleGuideInputChange('hourlyRate', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border rounded px-3 py-2"
                placeholder="例: 2000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                資格・認定
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tempInputs.certification}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, certification: e.target.value }))}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="例: 通訳案内士"
                />
                <button
                  type="button"
                  onClick={() => addToArray('guide', 'certifications', 'certification')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {guideProfile.certifications?.map((cert, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeFromArray('guide', 'certifications', index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 観光客用フィールド */}
            <div>
              <label className="block text-sm font-medium mb-2">
                母国語 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={guestProfile.nativeLanguage}
                onChange={(e) => handleGuestInputChange('nativeLanguage', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="例: 英語"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                学習したい言語
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tempInputs.learningLanguage}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, learningLanguage: e.target.value }))}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="例: 日本語"
                />
                <button
                  type="button"
                  onClick={() => addToArray('guest', 'learningLanguages', 'learningLanguage')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {guestProfile.learningLanguages.map((lang, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeFromArray('guest', 'learningLanguages', index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                訪問目的 <span className="text-red-500">*</span>
              </label>
              <select
                value={guestProfile.visitPurpose}
                onChange={(e) => handleGuestInputChange('visitPurpose', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択してください</option>
                <option value="観光">観光</option>
                <option value="ビジネス">ビジネス</option>
                <option value="留学">留学</option>
                <option value="文化体験">文化体験</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                興味のある分野 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tempInputs.interest}
                  onChange={(e) => setTempInputs(prev => ({ ...prev, interest: e.target.value }))}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="例: 歴史・文化"
                />
                <button
                  type="button"
                  onClick={() => addToArray('guest', 'interests', 'interest')}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  追加
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {guestProfile.interests.map((interest, index) => (
                  <span key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeFromArray('guest', 'interests', index)}
                      className="ml-2 text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={guestProfile.travelDates.startDate}
                  onChange={(e) => handleGuestInputChange('travelDates', {
                    ...guestProfile.travelDates,
                    startDate: e.target.value
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={guestProfile.travelDates.endDate}
                  onChange={(e) => handleGuestInputChange('travelDates', {
                    ...guestProfile.travelDates,
                    endDate: e.target.value
                  })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                予算（1日あたり・円）
              </label>
              <select
                value={guestProfile.budget}
                onChange={(e) => handleGuestInputChange('budget', e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">選択してください</option>
                <option value="〜5,000円">〜5,000円</option>
                <option value="5,000〜10,000円">5,000〜10,000円</option>
                <option value="10,000〜20,000円">10,000〜20,000円</option>
                <option value="20,000円〜">20,000円〜</option>
              </select>
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-4 pt-6">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </main>
  );
}