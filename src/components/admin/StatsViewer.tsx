// src/components/admin/StatsViewer.tsx
'use client';

import { useState, useEffect } from 'react';
import { getUserStats } from '@/firebase/firestore';

export default function StatsViewer() {
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ユーザー統計を取得
  const fetchUserStats = async () => {
    setLoading(true);
    try {
      const result = await getUserStats();
      setUserStats(result);
    } catch (error) {
      console.error('統計取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📊 統計情報</h2>
        <button
          onClick={fetchUserStats}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          リフレッシュ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">読み込み中...</div>
      ) : userStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 総ユーザー数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">👥</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">総ユーザー数</div>
                <div className="text-2xl font-bold text-gray-900">{userStats.totalUsers}</div>
              </div>
            </div>
          </div>

          {/* アクティブユーザー数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">✅</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">アクティブユーザー</div>
                <div className="text-2xl font-bold text-green-600">{userStats.activeUsers}</div>
              </div>
            </div>
          </div>

          {/* ガイド数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🎓</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">ガイド</div>
                <div className="text-2xl font-bold text-blue-600">{userStats.totalGuides}</div>
              </div>
            </div>
          </div>

          {/* 観光客数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">✈️</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">観光客</div>
                <div className="text-2xl font-bold text-green-600">{userStats.totalGuests}</div>
              </div>
            </div>
          </div>

          {/* 管理者数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🛡️</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">管理者</div>
                <div className="text-2xl font-bold text-purple-600">{userStats.totalAdmins}</div>
              </div>
            </div>
          </div>

          {/* 認証済みユーザー数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">🔐</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">認証済み</div>
                <div className="text-2xl font-bold text-green-600">{userStats.verifiedUsers}</div>
              </div>
            </div>
          </div>

          {/* 未認証ユーザー数 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">⚠️</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">未認証</div>
                <div className="text-2xl font-bold text-red-600">{userStats.unverifiedUsers}</div>
              </div>
            </div>
          </div>

          {/* プロフィール完了済み */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl">📋</div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">プロフィール完了</div>
                <div className="text-2xl font-bold text-blue-600">{userStats.completedProfiles}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <p>統計情報を読み込めませんでした</p>
        </div>
      )}
    </div>
  );
}