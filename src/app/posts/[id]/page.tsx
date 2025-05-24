"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
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
      alert("応募の送信に失敗しました。もう一度お試しください。");
    } finally {
      setSending(false);
    }
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (!post) {
    return <div className="text-center py-10">募集が見つかりません</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 text-blue-500 hover:text-blue-700 flex items-center gap-1"
      >
        ← 戻る
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">投稿者</h3>
              <p className="text-gray-700">{post.guestName}</p>
            </div>

            {/* 言語の表示 - 配列の存在チェック */}
            {post.languages && post.languages.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">希望言語</h3>
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
                <h3 className="text-lg font-semibold mb-2">希望エリア</h3>
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
                <h3 className="text-lg font-semibold mb-2">予算</h3>
                <p className="text-gray-700">{post.budget}</p>
              </div>
            )}

            {post.duration && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">希望時間</h3>
                <p className="text-gray-700">{post.duration}</p>
              </div>
            )}

            {post.date && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">希望日時</h3>
                <p className="text-gray-700">{post.date}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">投稿日</h3>
              <p className="text-gray-700">
                {new Date(post.createdAt).toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">詳細</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>
          </div>
        </div>

        {/* 応募送信セクション */}
        {user && guideName && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">この募集に応募する</h3>
            
            {applicationSent ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-green-800 font-medium">
                    応募を送信しました！
                  </span>
                </div>
                <p className="text-green-700 text-sm mt-2">
                  観光客からの返答をお待ちください。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    応募メッセージ（必須）
                  </label>
                  <textarea
                    id="message"
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="自己紹介や対応可能な内容、料金などを記載してください"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={handleSendApplication}
                  disabled={!applicationMessage.trim() || sending}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                  {sending ? "送信中..." : "応募する"}
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
                この募集に応募するには、ガイドとしてログインしてください。
              </p>
              <button
                onClick={() => router.push("/login")}
                className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                ログイン
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}