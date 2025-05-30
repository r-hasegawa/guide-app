// src/app/mypage/notice/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

// お知らせの型定義
interface Notice {
  id: string;
  title: string;
  date: string;
  content: string;
  isRead: boolean;
}

// ダミーデータ（実際のアプリでは Firebase から取得）
const dummyNotices: Notice[] = [
  {
    id: '1',
    title: 'サービスメンテナンスのお知らせ',
    date: '2025-05-30',
    content: '5月31日（土）午前2:00〜6:00の間、システムメンテナンスを実施いたします。この時間帯はサービスをご利用いただけませんので、ご了承ください。',
    isRead: false
  },
  {
    id: '2',
    title: '新機能「チャット機能」がリリースされました',
    date: '2025-05-25',
    content: 'マッチングが成立した相手とリアルタイムでチャットができる機能を追加しました。ぜひご活用ください。',
    isRead: true
  },
  {
    id: '3',
    title: 'ガイド料金の設定機能について',
    date: '2025-05-20',
    content: 'ガイドの方は、プロフィール編集画面から希望時給を設定できるようになりました。適切な料金設定で、より多くのマッチングを目指しましょう。',
    isRead: true
  },
  {
    id: '4',
    title: 'サービス利用規約の改定について',
    date: '2025-05-15',
    content: 'サービス利用規約を一部改定いたしました。詳細は設定画面の利用規約からご確認ください。',
    isRead: true
  },
  {
    id: '5',
    title: 'プライバシーポリシーの更新',
    date: '2025-05-10',
    content: '個人情報の取り扱いに関するプライバシーポリシーを更新いたしました。ユーザーの皆様により安心してご利用いただけるよう、セキュリティを強化しています。',
    isRead: true
  }
];

export default function NoticePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    // 実際のアプリでは Firebase からお知らせを取得
    setNotices(dummyNotices);
  }, [user, loading, router]);

  const handleNoticeClick = (notice: Notice) => {
    // 未読の場合は既読にする
    if (!notice.isRead) {
      setNotices(prev => 
        prev.map(n => 
          n.id === notice.id ? { ...n, isRead: true } : n
        )
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
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
          ← 戻る
        </button>
        <h1 className="text-2xl font-bold">🛎️ お知らせ</h1>
      </div>

      {/* お知らせ一覧 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">お知らせ一覧</h2>
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`p-6 border rounded-lg transition ${
              !notice.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className={`text-lg font-medium ${!notice.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                {notice.title}
              </h3>
              {!notice.isRead && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                  未読
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{formatDate(notice.date)}</p>
            <div className="prose max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {notice.content}
              </p>
            </div>
            {!notice.isRead && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => handleNoticeClick(notice)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  既読にする
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}