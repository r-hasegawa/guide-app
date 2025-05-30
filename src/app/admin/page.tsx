// src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { useAuthContext } from '@/contexts/AuthContext';
import { Announcement, CreateAnnouncementData, UserStats, AnnouncementStats } from '@/types/admin';
import { 
  createAnnouncement, 
  getAnnouncements, 
  getUserStats, 
  getAnnouncementStats,
  updateAnnouncement,
  deleteAnnouncement
} from '@/firebase/admin';

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'announcements' | 'create' | 'analytics'>('announcements');
  
  // お知らせ管理
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // 統計情報
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [announcementStats, setAnnouncementStats] = useState<AnnouncementStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 新規お知らせ作成
  const [newAnnouncement, setNewAnnouncement] = useState<CreateAnnouncementData>({
    title: '',
    content: '',
    type: 'info',
    targetAudience: 'all',
    priority: 1,
    isUrgent: false
  });

  // お知らせ一覧を取得
  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const result = await getAnnouncements(1, 20);
      setAnnouncements(result.announcements);
    } catch (error) {
      console.error('お知らせ取得エラー:', error);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  // 統計情報を取得
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [userStatsData, announcementStatsData] = await Promise.all([
        getUserStats(),
        getAnnouncementStats()
      ]);
      setUserStats(userStatsData);
      setAnnouncementStats(announcementStatsData);
    } catch (error) {
      console.error('統計情報取得エラー:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, []);

  // お知らせ作成
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      alert('タイトルと内容は必須です');
      return;
    }

    setCreating(true);
    try {
      await createAnnouncement(newAnnouncement, user.uid, user.email || '');
      
      // フォームリセット
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'info',
        targetAudience: 'all',
        priority: 1,
        isUrgent: false
      });

      alert('お知らせを作成しました');
      await fetchAnnouncements();
      await fetchStats();
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
      await deleteAnnouncement(announcementId, user.uid, user.email || '');
      alert('お知らせを削除しました');
      await fetchAnnouncements();
      await fetchStats();
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除に失敗しました');
    }
  };

  // 型別のバッジ色
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'urgent': return '緊急';
      case 'warning': return '注意';
      case 'maintenance': return 'メンテナンス';
      default: return 'お知らせ';
    }
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
                <button
                  onClick={() => window.location.href = '/mypage'}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  アプリに戻る
                </button>
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
                { id: 'create', label: '新規作成', icon: '➕' },
                { id: 'analytics', label: '分析', icon: '📊' }
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
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadgeColor(announcement.type)}`}>
                              {getTypeLabel(announcement.type)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {announcement.targetAudience === 'all' ? '全ユーザー' : 
                               announcement.targetAudience === 'guides' ? 'ガイド' : '観光客'}
                            </span>
                            {announcement.isUrgent && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                緊急
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              優先度: {announcement.priority}/5
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {announcement.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-4">
                            {announcement.content.length > 200 
                              ? `${announcement.content.substring(0, 200)}...`
                              : announcement.content}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>作成: {announcement.createdAt?.toLocaleDateString()}</span>
                            <span>閲覧: {announcement.viewCount || 0}回</span>
                            {announcement.expiresAt && (
                              <span>期限: {announcement.expiresAt.toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              // 編集機能は後で実装
                              alert('編集機能は準備中です');
                            }}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded"
                          >
                            編集
                          </button>
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
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      title: e.target.value
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="お知らせのタイトルを入力"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      content: e.target.value
                    })}
                    placeholder="お知らせの詳細内容を入力"
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">種類</label>
                    <select
                      value={newAnnouncement.type}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        type: e.target.value as any
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="info">お知らせ</option>
                      <option value="warning">注意</option>
                      <option value="urgent">緊急</option>
                      <option value="maintenance">メンテナンス</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">対象ユーザー</label>
                    <select
                      value={newAnnouncement.targetAudience}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        targetAudience: e.target.value as any
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">全ユーザー</option>
                      <option value="guides">ガイドのみ</option>
                      <option value="guests">観光客のみ</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">優先度 (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={newAnnouncement.priority}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        priority: parseInt(e.target.value)
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">有効期限（任意）</label>
                    <input
                      type="datetime-local"
                      value={newAnnouncement.expiresAt ? 
                        newAnnouncement.expiresAt.toISOString().slice(0, 16) : ''}
                      onChange={(e) => setNewAnnouncement({
                        ...newAnnouncement,
                        expiresAt: e.target.value ? new Date(e.target.value) : undefined
                      })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isUrgent"
                    checked={newAnnouncement.isUrgent}
                    onChange={(e) => setNewAnnouncement({
                      ...newAnnouncement,
                      isUrgent: e.target.checked
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                    緊急通知として送信（プッシュ通知対応）
                  </label>
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

          {/* 分析タブ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">📊 分析</h2>
                <button
                  onClick={fetchStats}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  データを更新
                </button>
              </div>

              {statsLoading ? (
                <div className="text-center py-10">データを読み込み中...</div>
              ) : (
                <div className="space-y-6">
                  {/* ユーザー統計 */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">👥 ユーザー統計</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {userStats?.totalUsers || 0}
                        </div>
                        <div className="text-sm text-gray-600">総ユーザー数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {userStats?.verifiedUsers || 0}
                        </div>
                        <div className="text-sm text-gray-600">認証済みユーザー</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {userStats?.totalGuides || 0}
                        </div>
                        <div className="text-sm text-gray-600">ガイド数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {userStats?.totalGuests || 0}
                        </div>
                        <div className="text-sm text-gray-600">観光客数</div>
                      </div>
                    </div>
                  </div>

                  {/* お知らせ統計 */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium mb-4">📢 お知らせ統計</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {announcementStats?.totalAnnouncements || 0}
                        </div>
                        <div className="text-sm text-gray-600">総お知らせ数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {announcementStats?.activeAnnouncements || 0}
                        </div>
                        <div className="text-sm text-gray-600">アクティブ</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {announcementStats?.totalViews || 0}
                        </div>
                        <div className="text-sm text-gray-600">総閲覧数</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {announcementStats?.averageViewsPerAnnouncement || 0}
                        </div>
                        <div className="text-sm text-gray-600">平均閲覧数</div>
                      </div>
                    </div>

                    {announcementStats?.mostViewedAnnouncement && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">最も閲覧されたお知らせ</h4>
                        <div className="text-lg font-medium">
                          {announcementStats.mostViewedAnnouncement.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {announcementStats.mostViewedAnnouncement.viewCount}回閲覧
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}