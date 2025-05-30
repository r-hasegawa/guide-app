// src/app/mypage/notice/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';

// シンプルなお知らせの型定義
interface Announcement {
  id: string;
  titleJa: string;
  titleEn: string;
  contentJa: string;
  contentEn: string;
  createdAt: any;
}

export default function NoticePage() {
  const { user, userInfo, loading } = useAuthContext();
  const { t, isJapanese } = useTranslation();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (user) {
      fetchAnnouncements();
    }
  }, [user, loading, router]);

  // お知らせ一覧を取得
  const fetchAnnouncements = async () => {
    try {
      const { getFirestore } = await import('@/firebase/firebaseConfig');
      const db = await getFirestore();
      if (!db) return;

      // 動的にFirestore関数をインポート
      const { collection, query, orderBy, getDocs } = await import('firebase/firestore');

      // 作成日時順でお知らせを取得
      const q = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const announcementList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Announcement[];

      setAnnouncements(announcementList);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    } finally {
      setPageLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(isJapanese ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || pageLoading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-blue-500 hover:text-blue-700"
        >
          ← {t.common.back}
        </button>
        <h1 className="text-2xl font-bold flex items-center">
          🛎️ {t.notice.notice}
        </h1>
      </div>

      {/* お知らせ一覧 */}
      <div className="space-y-6">
        {announcements.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p>{isJapanese ? 'お知らせはありません' : 'No notices available'}</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white border rounded-lg shadow-sm p-6"
            >
              {/* タイトル */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {isJapanese ? announcement.titleJa : announcement.titleEn}
                </h2>
                <div className="text-sm text-gray-500">
                  {isJapanese ? '公開日:' : 'Published:'} {formatDate(announcement.createdAt)}
                </div>
              </div>

              {/* 本文 */}
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {isJapanese ? announcement.contentJa : announcement.contentEn}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}