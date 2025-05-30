"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { 
  saveGuideProfile, 
  saveGuestProfile, 
  GuideProfile, 
  GuestProfile 
} from "@/firebase/firestore";

const LANGUAGE_OPTIONS = ["英語", "中国語", "フランス語", "ドイツ語", "スペイン語"];
const AREA_OPTIONS = ["東京", "大阪", "京都", "奈良", "福岡"];

export default function OnboardingPage() {
  const { user, userInfo, loading, refreshUserInfo } = useAuthContext();
  const router = useRouter();
  
  const [step, setStep] = useState<'role' | 'profile'>('role');
  const [selectedRole, setSelectedRole] = useState<'guide' | 'guest' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 初期プロフィールデータ
  const [guideProfile, setGuideProfile] = useState<GuideProfile>({
    name: "",
    languages: [],
    areas: [],
    introduction: ""
  });

  const [guestProfile, setGuestProfile] = useState<GuestProfile>({
    name: "",
    languages: [],
    introduction: "" // Added introduction for guest profile as well
  });

  const toggleSelection = (value: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter(item => item !== value));
    } else {
    setter([...list, value]);
    }
  };

  useEffect(() => {
    // ログインしていない場合はログインページへ
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    // プロフィールが完了している場合はマイページへ（オンボーディング不要）
    if (!loading && user && userInfo?.profileCompleted) {
      router.replace("/mypage");
      return;
    }

    // userInfoが存在してロールが設定されている場合はプロフィール設定へ
    if (!loading && user && userInfo && userInfo.role && !userInfo.profileCompleted) {
      console.log('User has role:', userInfo.role, 'going to profile step');
      setSelectedRole(userInfo.role);
      setStep('profile');
      return;
    }

    // userInfoが存在しない、またはロールが未設定の場合はロール選択から開始
    if (!loading && user && (!userInfo || !userInfo.role)) {
      console.log('User needs to select role, userInfo:', userInfo);
      setStep('role');
    }
  }, [user, userInfo, loading, router]);

  const handleRoleSelection = (role: 'guide' | 'guest') => {
    setSelectedRole(role);
    setStep('profile');
  };

  // Note: The addToArray and removeFromArray functions were present in the original code
  // but not used in the form's current structure for languages/areas (toggleSelection is used).
  // I'm keeping them as is, assuming they might be used for other dynamic fields or in future.
  const addToArray = (profileType: 'guide' | 'guest', field: string, value: string) => { // Added 'value' parameter
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

  const handleGuideInputChange = (field: keyof GuideProfile, value: any) => {
    setGuideProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleGuestInputChange = (field: keyof GuestProfile, value: any) => {
    // Corrected 'language' to 'languages' to match the state
    setGuestProfile(prev => ({ ...prev, [field]: value }));
  };

  const validateProfile = () => {
    if (selectedRole === 'guide') {
      if (!guideProfile.name.trim()) {
        setError("名前を入力してください。");
        return false;
      }
      if (guideProfile.languages.length === 0) {
        setError("話せる言語を少なくとも1つ選択してください。"); // Changed message slightly
        return false;
      }
      if (guideProfile.areas.length === 0) {
        setError("対応エリアを少なくとも1つ選択してください。"); // Changed message slightly
        return false;
      }
    } else { // selectedRole === 'guest'
      if (!guestProfile.name.trim()) {
        setError("名前を入力してください。");
        return false;
      }
      if (guestProfile.languages.length === 0) { // Corrected 'language' to 'languages'
        setError("話せる言語を少なくとも1つ選択してください。"); // Changed message slightly
        return false;
      }
      // Assuming introduction is optional for guest, or add validation if required
    }
    return true;
  };

  const handleProfileSave = async () => {
    if (!user || !selectedRole) return;

    setError("");
    
    if (!validateProfile()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedRole === 'guide') {
        await saveGuideProfile(user.uid, guideProfile);
      } else {
        await saveGuestProfile(user.uid, guestProfile);
      }
      
      // AuthContextの情報を更新
      await refreshUserInfo();
      
      router.push("/mypage");
    } catch (err) {
      console.error("プロフィール保存エラー:", err);
      setError("プロフィールの保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return null; // useEffectでリダイレクト処理されるので、何も表示しない
  }

  // プロフィール完了済みの場合はアクセス不可
  if (userInfo?.profileCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p>既にプロフィールが設定済みです。</p>
          <button 
            onClick={() => router.push("/mypage")}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            マイページへ
          </button>
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">ようこそ！</h1>
            <p className="text-gray-600">
              {user.displayName || user.email}さん、<br />
              どちらとしてご利用されますか？
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleRoleSelection('guide')}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition"
            >
              <div className="text-left">
                <div className="font-bold text-lg">🎓 ガイドとして登録</div>
                <div className="text-sm opacity-90 mt-1">
                  訪日観光客の方に日本の魅力を伝え、言語交流をしながら収入を得る
                </div>
              </div>
            </button>

            <button
              onClick={() => handleRoleSelection('guest')}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition"
            >
              <div className="text-left">
                <div className="font-bold text-lg">✈️ 観光客として登録</div>
                <div className="text-sm opacity-90 mt-1">
                  日本の学生ガイドと一緒に観光し、リアルな言語交流を体験する
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // プロフィール設定画面
  const isGuide = selectedRole === 'guide';

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {isGuide ? 'ガイドプロフィール設定' : '観光客プロフィール設定'}
        </h1>
        <p className="text-gray-600">
          {isGuide 
            ? 'ガイドとしてのプロフィールを設定してください。' 
            : '観光客としてのプロフィールを設定してください。'
          }
        </p>
      </div>

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
                対応言語 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    type="button"
                    key={lang}
                    className={`px-3 py-1 rounded border ${guideProfile.languages.includes(lang) ? "bg-blue-500 text-white" : "bg-white"}`}
                    onClick={() => toggleSelection(lang, guideProfile.languages, langs => handleGuideInputChange('languages', langs))}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                対応エリア <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AREA_OPTIONS.map(area => (
                  <button
                    key={area}
                    type="button"
                    className={`px-3 py-1 rounded border ${guideProfile.areas.includes(area) ? "bg-green-500 text-white" : "bg-white"}`}
                    onClick={() => toggleSelection(area, guideProfile.areas, areas => handleGuideInputChange('areas', areas))}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                自己紹介
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
                話せる言語 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    className={`px-3 py-1 rounded border ${guestProfile.languages.includes(lang) ? "bg-blue-500 text-white" : "bg-white"}`}
                    onClick={() => toggleSelection(lang, guestProfile.languages, langs => handleGuestInputChange('languages', langs))} // Corrected 'language' to 'languages'
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Added introduction field for guest profile */}
            <div>
              <label className="block text-sm font-medium mb-2">
                自己紹介 (任意)
              </label>
              <textarea
                value={guestProfile.introduction}
                onChange={(e) => handleGuestInputChange('introduction', e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2"
                placeholder="あなたの興味や日本での過ごし方について教えてください"
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
            onClick={handleProfileSave}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '保存中...' : 'プロフィールを保存'}
          </button>
        </div>
      </div>
    </main>
  );
}