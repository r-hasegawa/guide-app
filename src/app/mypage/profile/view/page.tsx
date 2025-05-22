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
            router.push("/mypage/profile/edit");
          }
        } else {
          const profile = await getGuestProfile(user.uid);
          if (profile) {
            setGuestProfile(profile);
          } else {
            router.push("/mypage/profile/edit");
          }
        }
      } catch (error) {
        console.error("プロフィール読み込みエラー:", error);
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

  if (!userInfo) {
    return null;
  }

  const isGuide = userInfo.role === 'guide';
  const profile = isGuide ? guideProfile : guestProfile;

  if (!profile) {
    return null;
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isGuide ? 'ガイドプロフィール' : '観光客プロフィール'}
          </h1>
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
                <h3 className="text-sm font-medium text-gray-500 mb-1">専門分野・得意エリア</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as GuideProfile).specialties.map((specialty, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">自己紹介</h3>
                <p className="whitespace-pre-line">{(profile as GuideProfile).introduction}</p>
              </div>

              {(profile as GuideProfile).availability && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">対応可能時間</h3>
                  <p>{(profile as GuideProfile).availability}</p>
                </div>
              )}

              {(profile as GuideProfile).hourlyRate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">希望時給</h3>
                  <p>{(profile as GuideProfile).hourlyRate}円/時間</p>
                </div>
              )}

              {(profile as GuideProfile).certifications && (profile as GuideProfile).certifications!.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">資格・認定</h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile as GuideProfile).certifications!.map((cert, index) => (
                      <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* 観光客専用フィールド */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">母国語</h3>
                <p>{(profile as GuestProfile).nativeLanguage}</p>
              </div>

              {(profile as GuestProfile).learningLanguages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">学習したい言語</h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile as GuestProfile).learningLanguages.map((lang, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">訪問目的</h3>
                <p>{(profile as GuestProfile).visitPurpose}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">興味のある分野</h3>
                <div className="flex flex-wrap gap-2">
                  {(profile as GuestProfile).interests.map((interest, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">旅行期間</h3>
                <p>
                  {(profile as GuestProfile).travelDates.startDate} 〜 {(profile as GuestProfile).travelDates.endDate}
                </p>
              </div>

              {(profile as GuestProfile).budget && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">予算（1日あたり）</h3>
                  <p>{(profile as GuestProfile).budget}</p>
                </div>
              )}
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