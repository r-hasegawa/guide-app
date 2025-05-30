// src/app/posts/[id]/page.tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTranslation } from "@/contexts/TranslationContext";
import { auth } from "@/firebase/firebaseConfig";
import { 
  getGuestPost, 
  getGuideProfile, 
  sendGuideApplication, 
  GuestPost 
} from "@/firebase/firestore";

interface PostDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const { t } = useTranslation();
  const [post, setPost] = useState<GuestPost | null>(null);
  const [guideName, setGuideName] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [applicationSent, setApplicationSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 投稿情報を取得
        const postData = await getGuestPost(id);
        if (!postData) {
          router.push("/posts");
          return;
        }
        setPost(postData);

        // ログイン中のユーザーがガイドの場合、名前を取得
        if (user) {
          const guideProfile = await getGuideProfile(user.uid);
          if (guideProfile) {
            setGuideName(guideProfile.name);
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

  const handleSendApplication = async () => {
    if (!user || !post || !guideName || !applicationMessage.trim()) {
      return;
    }

    setSending(true);
    try {
      await sendGuideApplication({
        guideId: user.uid,
        postId: id,
        guideName: guideName,
        guestName: post.guestName,
        guestId: post.guestId,
        message: applicationMessage.trim()
      });
      
      setApplicationSent(true);
      setApplicationMessage("");
    } catch (error) {
      console.error("応募の送信に失敗しました:", error);
      alert(t.errors.sendError);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t.isJapanese ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!post) {
    return <div className="text-center py-10">
      {t.isJapanese ? '募集が見つかりません' : 'Job posting not found'}
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
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {t.isJapanese ? '投稿者' : 'Posted by'}
              </h3>
              <p className="text-gray-700">{post.guestName}</p>
            </div>

            {/* 言語の表示 - 配列の存在チェック */}
            {post.languages && post.languages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{t.posts.preferredLanguages}</h3>
                <div className="flex flex-wrap gap-2">
                  {post.languages.map((language, index) => (
                    <span
                      key={`${language}-${index}`}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* エリアの表示 - 配列の存在チェック */}
            {post.areas && post.areas.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{t.posts.preferredAreas}</h3>
                <div className="flex flex-wrap gap-2">
                  {post.areas.map((area, index) => (
                    <span
                      key={`${area}-${index}`}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {post.budget && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{t.common.budget}</h3>
                <p className="text-gray-700">{post.budget}</p>
              </div>
            )}

            {post.duration && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{t.posts.preferredTime}</h3>
                <p className="text-gray-700">{post.duration}</p>
              </div>
            )}

            {post.date && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{t.posts.preferredDate}</h3>
                <p className="text-gray-700">{post.date}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">
                {t.isJapanese ? '投稿日' : 'Posted on'}
              </h3>
              <p className="text-gray-700">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">{t.posts.description}</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>
          </div>
        </div>

        {/* 応募送信セクション */}
        {user && guideName && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t.posts.applyToPost}</h3>
            
            {applicationSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-green-800 font-medium">
                    {t.posts.applicationSent}
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
                    {t.posts.applicationMessage} ({t.common.required})
                  </label>
                  <textarea
                    id="message"
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder={t.isJapanese
                      ? "自己紹介や対応可能な内容、料金などを記載してください"
                      : "Please describe your self-introduction, what you can offer, rates, etc."
                    }
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleSendApplication}
                  disabled={!applicationMessage.trim() || sending}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {sending ? t.common.processing : t.common.apply}
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
                  ? 'この募集に応募するには、ガイドとしてログインしてください。'
                  : 'To apply to this job, please log in as a guide.'
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