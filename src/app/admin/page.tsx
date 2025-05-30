// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  getAnnouncements, 
  createAnnouncement, 
  deleteAnnouncement,
  Announcement,
  CreateAnnouncementData 
} from '@/firebase/firestore';

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'announcements' | 'create'>('announcements');
  
  // お知らせ管理
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // 新規お知らせ作成
  const [newAnnouncement, setNewAnnouncement] = useState<CreateAnnouncementData>({
    titleJa: '',
    titleEn: '',
    contentJa: '',
    contentEn: ''
  });

  // お知らせ一覧を取得
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const result = await getAnnouncements();
      setAnnouncements(result);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // お知らせ作成
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newAnnouncement.titleJa.trim() || !newAnnouncement.titleEn.trim() || 
        !newAnnouncement.contentJa.trim() || !newAnnouncement.contentEn.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    setCreating(true);
    try {
      await createAnnouncement({
        titleJa: newAnnouncement.titleJa.trim(),
        titleEn: newAnnouncement.titleEn.trim(),
        contentJa: newAnnouncement.contentJa.trim(),
        contentEn: newAnnouncement.contentEn.trim()
      });
      
      // フォームリセット
      setNewAnnouncement({
        titleJa: '',
        titleEn: '',
        contentJa: '',
        contentEn: ''
      });

      alert('お知らせを作成しました');
      await fetchAnnouncements();
      setActiveTab('announcements');
    } catch (error) {
      console.error('お知らせ作成エラー:', error);
      alert('お知らせの作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

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
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900">🛡️ 管理画面</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  管理者: {user?.email}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* タブナビゲーション */}
        <nav className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              {[
                { id: 'announcements', label: 'お知らせ管理', icon: '📢' },
                { id: 'create', label: '新規作成', icon: '➕' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          
          {/* お知らせ管理タブ */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">📢 お知らせ管理</h2>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  新しいお知らせを作成
                </button>
              </div>

              {announcementsLoading ? (
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
          )}

          {/* 新規作成タブ */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">➕ 新しいお知らせを作成</h2>
              
              <form onSubmit={handleCreateAnnouncement} className="bg-white p-6 rounded-lg shadow space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    日本語タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.titleJa}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      titleJa: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="お知らせのタイトル（日本語）を入力"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    English Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.titleEn}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      titleEn: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter the title in English"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    日本語本文 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newAnnouncement.contentJa}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      contentJa: e.target.value
                    })}
                    placeholder="お知らせの詳細内容（日本語）を入力"
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    English Content <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newAnnouncement.contentEn}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      contentEn: e.target.value
                    })}
                    placeholder="Enter the detailed content in English"
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('announcements')}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {creating ? '作成中...' : 'お知らせを作成'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}