// src/app/guides/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTranslation } from "@/contexts/TranslationContext";
import { auth } from "@/firebase/firebaseConfig";
import { 
  getGuideProfile, 
  getGuestProfile, 
  sendMatchingRequest, 
  GuideProfile 
} from "@/firebase/firestore";

interface GuideDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const { t } = useTranslation();
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [guestName, setGuestName] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);
  const [requestMessage, setRequestMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ガイド情報を取得
        const guideData = await getGuideProfile(id);
        if (!guideData) {
          router.push("/guides");
          return;
        }
        setGuide(guideData);

        // ログイン中のユーザーが観光客の場合、名前を取得
        if (user) {
          const guestProfile = await getGuestProfile(user.uid);
          if (guestProfile) {
            setGuestName(guestProfile.name);
          }
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
  }, [id, user, loading, router]);

  const handleSendRequest = async () => {
    if (!user || !guide || !guestName || !requestMessage.trim()) {
      return;
    }

    setSending(true);
    try {
      await sendMatchingRequest({
        guestId: user.uid,
        guideId: id,
        guestName: guestName,
        guideName: guide.name,
        message: requestMessage.trim()
      });
      
      setRequestSent(true);
      setRequestMessage("");
    } catch (error) {
      console.error("リクエストの送信に失敗しました:", error);
      alert(t.errors.sendError);
    } finally {
      setSending(false);
    }
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!guide) {
    return <div className="text-center py-10">
      {t.isJapanese ? 'ガイドが見つかりません' : 'Guide not found'}
    </div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-1"
      >
        ← {t.common.back}
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{guide.name}</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t.profile.supportedLanguages}</h3>
              <div className="flex flex-wrap gap-2">
                {guide.languages.map(language => (
                  <span
                    key={language}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">{t.profile.supportedAreas}</h3>
              <div className="flex flex-wrap gap-2">
                {guide.areas.map(area => (
                  <span
                    key={area}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {guide.introduction && (
            <div>
              <h3 className="text-lg font-semibold mb-2">{t.profile.selfIntroduction}</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {guide.introduction}
              </p>
            </div>
          )}
        </div>

        {/* リクエスト送信セクション */}
        {user && guestName && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">
              {t.isJapanese ? 'マッチングリクエストを送信' : 'Send Matching Request'}
            </h3>
            
            {requestSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-green-800 font-medium">
                    {t.guides.requestSent}
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  {t.requests.waitingForResponse}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    {t.common.message} ({t.common.required})
                  </label>
                  <textarea
                    id="message"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder={t.isJapanese 
                      ? "ガイドに伝えたいことを書いてください（希望する日時、場所、特別なリクエストなど）"
                      : "Please write what you want to tell the guide (desired date/time, location, special requests, etc.)"
                    }
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleSendRequest}
                  disabled={!requestMessage.trim() || sending}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {sending ? t.common.processing : t.guides.sendRequest}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ログインしていない場合の表示 */}
        {!user && (
          <div className="mt-8 border-t pt-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">
                {t.isJapanese
                  ? 'このガイドにリクエストを送信するには、観光客としてログインしてください。'
                  : 'To send a request to this guide, please log in as a tourist.'
                }
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                {t.auth.login}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}