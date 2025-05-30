// src/components/admin/AnnouncementCreator.tsx
'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { 
  createAnnouncement,
  CreateAnnouncementData 
} from '@/firebase/firestore';

interface AnnouncementCreatorProps {
  onSuccess: () => void;
}

export default function AnnouncementCreator({ onSuccess }: AnnouncementCreatorProps) {
  const { user } = useAuthContext();
  const [creating, setCreating] = useState(false);

  // 新規お知らせ作成
  const [newAnnouncement, setNewAnnouncement] = useState<CreateAnnouncementData>({
    titleJa: '',
    titleEn: '',
    contentJa: '',
    contentEn: ''
  });

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
      onSuccess();
    } catch (error) {
      console.error('お知らせ作成エラー:', error);
      alert('お知らせの作成に失敗しました');
    } finally {
      setCreating(false);
    }
  };

  return (
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
            onClick={onSuccess}
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
  );
}