// src/app/mypage/notice/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';

// お知らせの型定義
interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'urgent' | 'maintenance';
  targetAudience: 'all' | 'guides' | 'guests';
  priority: number;
  isUrgent: boolean;
  createdAt: any;
  expiresAt?: any;
  viewCount: number;
}

// 既読状態の型定義
interface ReadStatus {
  [announcementId: string]: {
    isRead: boolean;
    readAt: any;
  };
}

export default function NoticePage() {
  const { user, userInfo, loading } = useAuthContext();
  const { t, isJapanese } = useTranslation();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readStatus, setReadStatus] = useState<ReadStatus>({});
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (user && userInfo) {
      fetchAnnouncements();
      fetchReadStatus();
    }
  }, [user, userInfo, loading, router]);

  // お知らせ一覧を取得
  const fetchAnnouncements = async () => {
    if (!userInfo) return;

    try {
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
      const { getFirestore } = await import('@/firebase/firebaseConfig');
      
      const db = await getFirestore();
      if (!db) return;

      // 自分が対象のお知らせのみ取得
      const q = query(
        collection(db, 'announcements'),
        where('isActive', '==', true),
        where('targetAudience', 'in', ['all', userInfo.role]),
        orderBy('priority', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const announcementList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      })) as Announcement[];

      // 期限切れのお知らせを除外
      const now = new Date();
      const validAnnouncements = announcementList.filter(announcement => {
        if (!announcement.expiresAt) return true;
        return announcement.expiresAt > now;
      });

      setAnnouncements(validAnnouncements);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    } finally {
      setPageLoading(false);
    }
  };

  // 既読状態を取得
  const fetchReadStatus = async () => {
    if (!user) return;

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { getFirestore } = await import('@/firebase/firebaseConfig');
      
      const db = await getFirestore();
      if (!db) return;

      const statusDoc = await getDoc(doc(db, 'user_announcement_status', user.uid));
      if (statusDoc.exists()) {
        setReadStatus(statusDoc.data() as ReadStatus);
      }
    } catch (error) {
      console.error('既読状態取得エラー:', error);
    }
  };

  // 既読にする
  const markAsRead = async (announcementId: string) => {
    if (!user) return;

    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { getFirestore } = await import('@/firebase/firebaseConfig');
      
      const db = await getFirestore();
      if (!db) return;

      await setDoc(
        doc(db, 'user_announcement_status', user.uid),
        {
          [announcementId]: {
            isRead: true,
            readAt: serverTimestamp()
          }
        },
        { merge: true }
      );

      // ローカル状態を更新
      setReadStatus(prev => ({
        ...prev,
        [announcementId]: {
          isRead: true,
          readAt: new Date()
        }
      }));

      // 閲覧数を増加（管理者のみ可能なので、クライアントサイドでは実装しない）
      
    } catch (error) {
      console.error('既読状態更新エラー:', error);
    }
  };

  // お知らせの種類に応じたアイコンを取得
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return '🚨';
      case 'warning': return '⚠️';
      case 'maintenance': return '🔧';
      default: return '📢';
    }
  };

  // お知らせの種類に応じた色を取得
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'maintenance': return 'bg-purple-50 border-purple-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = (type: string) => {
    if (isJapanese) {
      switch (type) {
        case 'urgent': return '緊急';
        case 'warning': return '注意';
        case 'maintenance': return 'メンテナンス';
        default: return 'お知らせ';
      }
    } else {
      switch (type) {
        case 'urgent': return 'Urgent';
        case 'warning': return 'Warning';
        case 'maintenance': return 'Maintenance';
        default: return 'Notice';
      }
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

  // 未読のお知らせを優先して表示するためにソート
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const aIsRead = readStatus[a.id]?.isRead || false;
    const bIsRead = readStatus[b.id]?.isRead || false;
    
    // 未読を優先
    if (aIsRead !== bIsRead) {
      return aIsRead ? 1 : -1;
    }
    
    // 優先度順
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    
    // 緊急フラグ順
    if (a.isUrgent !== b.isUrgent) {
      return a.isUrgent ? -1 : 1;
    }
    
    // 作成日時順
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const unreadCount = announcements.filter(announcement => 
    !readStatus[announcement.id]?.isRead
  ).length;

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
          {unreadCount > 0 && (
            <span className="ml-3 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-blue-600">{announcements.length}</div>
          <div className="text-sm text-gray-600">
            {isJapanese ? '総お知らせ数' : 'Total Notices'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
          <div className="text-sm text-gray-600">
            {isJapanese ? '未読' : 'Unread'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-orange-600">
            {announcements.filter(a => a.isUrgent).length}
          </div>
          <div className="text-sm text-gray-600">
            {isJapanese ? '緊急' : 'Urgent'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-green-600">
            {announcements.length - unreadCount}
          </div>
          <div className="text-sm text-gray-600">
            {isJapanese ? '既読' : 'Read'}
          </div>
        </div>
      </div>

      {/* お知らせ一覧 */}
      <div className="space-y-4">
        {sortedAnnouncements.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <div className="text-6xl mb-4">📭</div>
            <p>{isJapanese ? 'お知らせはありません' : 'No notices available'}</p>
          </div>
        ) : (
          sortedAnnouncements.map((announcement) => {
            const isRead = readStatus[announcement.id]?.isRead || false;
            
            return (
              <div
                key={announcement.id}
                className={`p-6 border rounded-lg transition ${
                  isRead 
                    ? 'bg-white border-gray-200' 
                    : `${getTypeColor(announcement.type)} border-2`
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColor(announcement.type)}`}>
                          {getTypeLabel(announcement.type)}
                        </span>
                        {announcement.isUrgent && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            {isJapanese ? '緊急' : 'Urgent'}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {isJapanese ? '優先度' : 'Priority'}: {announcement.priority}/5
                        </span>
                      </div>
                      <h3 className={`text-lg font-medium ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                        {announcement.title}
                      </h3>
                    </div>
                  </div>
                  
                  {!isRead && (
                    <div className="flex items-center space-x-2">
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {t.notice.unread}
                      </span>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none mb-4">
                  <p className={`leading-relaxed whitespace-pre-wrap ${isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                    {announcement.content}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>
                      {isJapanese ? '投稿日時:' : 'Posted:'} {formatDate(announcement.createdAt)}
                    </div>
                    {announcement.expiresAt && (
                      <div>
                        {isJapanese ? '有効期限:' : 'Expires:'} {formatDate(announcement.expiresAt)}
                      </div>
                    )}
                  </div>

                  {!isRead && (
                    <button
                      onClick={() => markAsRead(announcement.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm transition"
                    >
                      {t.notice.markAsRead}
                    </button>
                  )}
                </div>

                {isRead && readStatus[announcement.id]?.readAt && (
                  <div className="mt-3 pt-3 border-t text-xs text-gray-400">
                    {isJapanese ? '既読日時:' : 'Read on:'} {
                      readStatus[announcement.id].readAt.toDate 
                        ? formatDate(readStatus[announcement.id].readAt.toDate())
                        : formatDate(new Date(readStatus[announcement.id].readAt))
                    }
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 一括既読ボタン */}
      {unreadCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              for (const announcement of announcements) {
                if (!readStatus[announcement.id]?.isRead) {
                  await markAsRead(announcement.id);
                }
              }
            }}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
          >
            {isJapanese ? 'すべて既読にする' : 'Mark all as read'} ({unreadCount})
          </button>
        </div>
      )}
    </div>
  );
}