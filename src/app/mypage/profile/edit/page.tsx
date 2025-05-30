// src/app/mypage/profile/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { LANGUAGE_OPTIONS, AREA_OPTIONS } from "@/constants/options";
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
  const { t } = useTranslation();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // ガイド用フォームデータ
  const [guideProfile, setGuideProfile] = useState<GuideProfile>({
    name: "",
    languages: [],
    areas: [],
    introduction: ""
  });

  // 観光客用フォームデータ
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({
    name: "",
    languages: [],
    introduction: ""
  });

  // useEffect for initial redirection if not logged in or role not set
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
      return;
    }

    // If userInfo is loaded but role is not set, redirect to onboarding
    if (!loading && user && userInfo && !userInfo.role) {
      router.replace("/profile/onboarding");
      return;
    }
  }, [user, userInfo, loading, router]);

  // useEffect to fetch existing profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !userInfo) return;

      try {
        if (userInfo.role === 'guide') {
          const existing = await getGuideProfile(user.uid);
          if (existing) {
            setGuideProfile(prev => ({
              ...prev,
              name: existing.name || "",
              languages: existing.languages || [],
              areas: existing.areas || [],
              introduction: existing.introduction || ""
            }));
          }
        } else { // userInfo.role === 'guest'
          const existing = await getGuestProfile(user.uid);
          if (existing) {
            setGuestProfile(prev => ({
              ...prev,
              name: existing.name || "",
              languages: existing.languages || [],
              introduction: existing.introduction || ""
            }));
          }
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

  // Helper for toggling selections (used for languages/areas)
  const toggleSelection = (value: string, list: string[], setter: (val: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter(item => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const validateForm = () => {
    setError(""); // Clear previous errors
    if (userInfo?.role === 'guide') {
      if (!guideProfile.name.trim()) {
        setError(t.isJapanese ? "名前を入力してください。" : "Please enter your name.");
        return false;
      }
      if (guideProfile.languages.length === 0) {
        setError(t.isJapanese ? "話せる言語を少なくとも1つ選択してください。" : "Please select at least one language you can speak.");
        return false;
      }
      if (guideProfile.areas.length === 0) {
        setError(t.isJapanese ? "対応エリアを少なくとも1つ選択してください。" : "Please select at least one area you can guide.");
        return false;
      }
      if (!guideProfile.introduction?.trim()) {
        setError(t.isJapanese ? "自己紹介を入力してください。" : "Please enter your self-introduction.");
        return false;
      }
    } else { // userInfo.role === 'guest'
      if (!guestProfile.name.trim()) {
        setError(t.isJapanese ? "名前を入力してください。" : "Please enter your name.");
        return false;
      }
      if (guestProfile.languages.length === 0) {
        setError(t.isJapanese ? "話せる言語を少なくとも1つ選択してください。" : "Please select at least one language you can speak.");
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
      setError(t.errors.saveError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !userInfo) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  const isGuide = userInfo.role === 'guide';

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        {isGuide ? t.profile.guideProfile : t.profile.guestProfile}{t.profile.profileEdit}
      </h1>

      <div className="space-y-6">
        {/* 名前 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t.common.name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={isGuide ? guideProfile.name : guestProfile.name}
            onChange={(e) => isGuide
              ? handleGuideInputChange('name', e.target.value)
              : handleGuestInputChange('name', e.target.value)
            }
            className="w-full border rounded px-3 py-2"
            placeholder={t.isJapanese ? "山田 太郎" : "John Doe"}
          />
        </div>

        {isGuide ? (
          <>
            {/* ガイド用フィールド */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.profile.supportedLanguages} <span className="text-red-500">*</span>
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
                {t.profile.supportedAreas} <span className="text-red-500">*</span>
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
                {t.profile.selfIntroduction} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={guideProfile.introduction || ""}
                onChange={(e) => handleGuideInputChange('introduction', e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2"
                placeholder={t.isJapanese ? "あなたのガイド経験や特徴を教えてください" : "Please tell us about your guiding experience and characteristics"}
              />
            </div>
          </>
        ) : (
          <>
            {/* 観光客用フィールド */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t.profile.spokenLanguages} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    className={`px-3 py-1 rounded border ${guestProfile.languages.includes(lang) ? "bg-blue-500 text-white" : "bg-white"}`}
                    onClick={() => toggleSelection(lang, guestProfile.languages, langs => handleGuestInputChange('languages', langs))}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t.profile.selfIntroduction} ({t.common.optional})
              </label>
              <textarea
                value={guestProfile.introduction || ""}
                onChange={(e) => handleGuestInputChange('introduction', e.target.value)}
                rows={4}
                className="w-full border rounded px-3 py-2"
                placeholder={t.isJapanese ? "あなたの興味や日本での過ごし方について教えてください" : "Please tell us about your interests and how you'd like to spend time in Japan"}
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
            {t.common.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? t.common.processing : t.common.save}
          </button>
        </div>
      </div>
    </main>
  );
}