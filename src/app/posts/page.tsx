// src/app/posts/page.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTranslation } from "@/contexts/TranslationContext";
import { auth } from "@/firebase/firebaseConfig";
import { 
  getAllGuestPosts,
  getGuestPostsByUser,
  deleteGuestPost,
  getUserBasicInfo,
  GuestPost
} from "@/firebase/firestore";

export default function PostsPage() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { t, isJapanese } = useTranslation();
  const [userRole, setUserRole] = useState<'guide' | 'guest' | 'admin' | null>(null); // admin追加
  const [posts, setPosts] = useState<GuestPost[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingPost, setDeletingPost] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setPageLoading(false);
        return;
      }

      try {
        // ユーザーの役割を取得
        const userInfo = await getUserBasicInfo(user.uid);
        if (!userInfo) {
          setPageLoading(false);
          return;
        }
        
        setUserRole(userInfo.role);

        // 管理者は投稿機能にアクセスできない
        if (userInfo.role === 'admin') {
          router.replace('/admin');
          return;
        }

        // 役割に応じて投稿を取得
        if (userInfo.role === 'guide') {
          // ガイドの場合：全ての募集投稿を表示（応募済みは除外）
          const allPosts = await getAllGuestPosts(user.uid);
          setPosts(allPosts || []); // undefined の場合は空配列にする
        } else if (userInfo.role === 'guest') {
          // 観光客の場合：自分の投稿のみを表示
          const myPosts = await getGuestPostsByUser(user.uid);
          setPosts(myPosts || []); // undefined の場合は空配列にする
        }
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
        setPosts([]); // エラー時も空配列にする
      } finally {
        setPageLoading(false);
      }
    };

    if (!loading) {
      fetchData();
    }
  }, [user, loading, router]);

  const handleDeletePost = async (postId: string) => {
    const confirmMessage = isJapanese ? 'この募集を削除しますか？' : 'Are you sure you want to delete this job?';
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingPost(postId);
    try {
      await deleteGuestPost(postId);
      setPosts(prev => prev.filter(post => post.id !== postId));
      alert(t.success.postDeleted);
    } catch (error) {
      console.error("削除に失敗しました:", error);
      alert(t.errors.deleteError);
    } finally {
      setDeletingPost(null);
    }
  };

  const handleCreatePost = () => {
    router.push("/posts/create");
  };

  const handleViewPost = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{t.common.active}</span>;
      case 'closed':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{t.common.closed}</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          {isJapanese ? '不明' : 'Unknown'}
        </span>;
    }
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!user || !userRole) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">📝 {t.posts.postList}</h1>
        <p className="text-gray-600">
          {isJapanese ? 'ログインしてください。' : 'Please log in.'}
        </p>
      </div>
    );
  }

  // 管理者の場合は何も表示しない（既にリダイレクト済み）
  if (userRole === 'admin') {
    return null;
  }

  const pageTitle = userRole === 'guide' ? t.posts.guideRecruitment : t.posts.myPosts;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          📝 {pageTitle}
        </h1>
        {userRole === 'guest' && (
          <button
            onClick={handleCreatePost}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            {t.posts.createPost}
          </button>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>
            {userRole === 'guide' 
              ? (isJapanese ? '現在募集中のガイド案件はありません' : 'No guide jobs currently available')
              : t.posts.noPosts
            }
          </p>
          {userRole === 'guest' && (
            <button
              onClick={handleCreatePost}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
            >
              {t.posts.createFirstPost}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-semibold line-clamp-2">{post.title}</h2>
                {getStatusBadge(post.status)}
              </div>

              {userRole === 'guide' && (
                <p className="text-sm text-gray-600 mb-2">
                  {isJapanese ? '投稿者:' : 'Posted by:'} {post.guestName}
                </p>
              )}

              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {post.description}
              </p>

              <div className="space-y-2 mb-4">
                {/* 言語の表示 - 配列の存在チェック */}
                {post.languages && post.languages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t.posts.preferredLanguages}:</p>
                    <div className="flex flex-wrap gap-1">
                      {post.languages.map((language, index) => (
                        <span
                          key={`${language}-${index}`}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* エリアの表示 - 配列の存在チェック */}
                {post.areas && post.areas.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t.posts.preferredAreas}:</p>
                    <div className="flex flex-wrap gap-1">
                      {post.areas.map((area, index) => (
                        <span
                          key={`${area}-${index}`}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {post.date && (
                  <p className="text-xs text-gray-600">
                    {t.posts.preferredDate}: {post.date}
                  </p>
                )}

                {post.duration && (
                  <p className="text-xs text-gray-600">
                    {t.posts.preferredTime}: {post.duration}
                  </p>
                )}

                {post.budget && (
                  <p className="text-xs text-gray-600">
                    {t.common.budget}: {post.budget}
                  </p>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-4">
                {formatDate(post.createdAt)}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewPost(post.id)}
                  className="flex-1 bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600 transition"
                >
                  {isJapanese ? '詳細を見る' : 'View Details'}
                </button>
                
                {userRole === 'guest' && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    disabled={deletingPost === post.id}
                    className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {deletingPost === post.id ? t.common.processing : t.common.delete}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}