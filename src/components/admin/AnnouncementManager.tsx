// src/components/admin/AnnouncementManager.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  getAnnouncements, 
  deleteAnnouncement,
  Announcement
} from '@/firebase/firestore';

interface AnnouncementManagerProps {
  onCreateNew: () => void;
}

export default function AnnouncementManager({ onCreateNew }: AnnouncementManagerProps) {
  const { user } = useAuthContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);

  // お知らせ一覧を取得
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const result = await getAnnouncements();
      setAnnouncements(result);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // お知らせ削除
  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!user) return;
    
    if (!confirm('このお知らせを削除しますか？')) return;

    try {
      await deleteAnnouncement(announcementId);
      alert('お知らせを削除しました');
      await fetchAnnouncements();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📢 お知らせ管理</h2>
        <button
          onClick={onCreateNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          新しいお知らせを作成
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">読み込み中...</div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <div className="text-6xl mb-4">📭</div>
          <p>まだお知らせがありません</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="bg-white border rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    日本語: {announcement.titleJa}
                  </h3>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    English: {announcement.titleEn}
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">日本語本文:</h4>
                    <p className="text-gray-600 mb-3 whitespace-pre-wrap">
                      {announcement.contentJa.length > 200 
                        ? `${announcement.contentJa.substring(0, 200)}...`
                        : announcement.contentJa}
                    </p>
                    
                    <h4 className="text-sm font-medium text-gray-700 mb-1">English本文:</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {announcement.contentEn.length > 200 
                        ? `${announcement.contentEn.substring(0, 200)}...`
                        : announcement.contentEn}
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    作成: {formatDate(announcement.createdAt)}
                  </div>
                </div>
                
                <div className="ml-4">
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}