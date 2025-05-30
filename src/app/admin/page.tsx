// src/app/admin/page.tsx
'use client';

import { useState } from 'react';
import AdminGuard from '@/components/AdminGuard';
import { useAuthContext } from '@/contexts/AuthContext';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import AnnouncementCreator from '@/components/admin/AnnouncementCreator';
import UserManager from '@/components/admin/UserManager';
import StatsViewer from '@/components/admin/StatsViewer';

export default function AdminDashboard() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'announcements' | 'create' | 'users' | 'stats'>('announcements');

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
                { id: 'create', label: '新規作成', icon: '➕' },
                { id: 'users', label: 'ユーザー管理', icon: '👥' },
                { id: 'stats', label: '統計情報', icon: '📊' }
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
          {activeTab === 'announcements' && (
            <AnnouncementManager onCreateNew={() => setActiveTab('create')} />
          )}
          {activeTab === 'create' && (
            <AnnouncementCreator onSuccess={() => setActiveTab('announcements')} />
          )}
          {activeTab === 'users' && <UserManager />}
          {activeTab === 'stats' && <StatsViewer />}
        </main>
      </div>
    </AdminGuard>
  );
}