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
  const { user, userInfo, loading, refreshUserInfo } = useAuthContext();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // ガイド用フォームデータ
  const [guideProfile, setGuideProfile] = useState<GuideProfile>({
    name: "",
    languages: [],
    introduction: "",
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

    if (!loading && user && userInfo && !userInfo.role) {
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

  const validateForm = () => {
    if (userInfo?.role === 'guide') {
      if (!guideProfile.name.trim()) {
        setError("名前を入力してください。");
        return false;
      }
      if (guideProfile.languages.length === 0) {
        setError("話せる言語を少なくとも1つ入力してください。");
        return false;
      }
      if (!guideProfile.introduction.trim()) {
        setError("自己紹介を入力してください。");
        return false;
      }
    } else {
      if (!guestProfile.name.trim()) {
        setError("名前を入力してください。");
        return false;
      }
      if (!guestProfile.nativeLanguage.trim()) {
        setError("母国語を入力してください。");
        return false;
      }
      if (!guestProfile.visitPurpose.trim()) {
        setError("訪問目的を選択してください。");
        return false;
      }
      if (guestProfile.interests.length === 0) {
        setError("興味のある分野を少なくとも1つ入力してください。");
        return false;
      }
      if (!guestProfile.travelDates.startDate || !guestProfile.travelDates.endDate) {
        setError("旅行期間を入力してください。");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!user || !userInfo) return;

    setError("");
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (userInfo.role === 'guide') {
        await saveGuideProfile(user.uid, guideProfile);
      } else {
        await saveGuestProfile(user.uid, guestProfile);
      }
      
      // AuthContextの情報を更新
      await refreshUserInfo();
      
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
                言語 <span className="text-red-500">*</span>
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
          </>
        ) : (
          <>
            {/* 観光客用フィールド */}
            <div>
              <label className="block text-sm font-medium mb-2">
                言語 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={guestProfile.nativeLanguage}
                onChange={(e) => handleGuestInputChange('nativeLanguage', e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="例: 英語"
              />
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
            disabled={isSubmitting}
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