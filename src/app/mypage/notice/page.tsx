// src/app/mypage/notice/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';

// お知らせの型定義
interface Notice {
  id: string;
  title: string;
  titleEn: string;
  date: string;
  content: string;
  contentEn: string;
  isRead: boolean;
}

// ダミーデータ（実際のアプリでは Firebase から取得）
const dummyNotices: Notice[] = [
  {
    id: '1',
    title: 'サービスメンテナンスのお知らせ',
    titleEn: 'Service Maintenance Notice',
    date: '2025-05-30',
    content: '5月31日（土）午前2:00〜6:00の間、システムメンテナンスを実施いたします。この時間帯はサービスをご利用いただけませんので、ご了承ください。',
    contentEn: 'We will conduct system maintenance from 2:00 AM to 6:00 AM on Saturday, May 31st. The service will not be available during this time. Thank you for your understanding.',
    isRead: false
  },
  {
    id: '2',
    title: '新機能「チャット機能」がリリースされました',
    titleEn: 'New "Chat Feature" Released',
    date: '2025-05-25',
    content: 'マッチングが成立した相手とリアルタイムでチャットができる機能を追加しました。ぜひご活用ください。',
    contentEn: 'We have added a feature that allows real-time chat with matched partners. Please make use of this new functionality.',
    isRead: true
  },
  {
    id: '3',
    title: 'ガイド料金の設定機能について',
    titleEn: 'About Guide Fee Setting Feature',
    date: '2025-05-20',
    content: 'ガイドの方は、プロフィール編集画面から希望時給を設定できるようになりました。適切な料金設定で、より多くのマッチングを目指しましょう。',
    contentEn: 'Guides can now set their desired hourly rate from the profile editing screen. Set appropriate rates to aim for more matches.',
    isRead: true
  },
  {
    id: '4',
    title: 'サービス利用規約の改定について',
    titleEn: 'Terms of Service Update',
    date: '2025-05-15',
    content: 'サービス利用規約を一部改定いたしました。詳細は設定画面の利用規約からご確認ください。',
    contentEn: 'We have partially updated our Terms of Service. Please check the Terms of Service in the settings screen for details.',
    isRead: true
  },
  {
    id: '5',
    title: 'プライバシーポリシーの更新',
    titleEn: 'Privacy Policy Update',
    date: '2025-05-10',
    content: '個人情報の取り扱いに関するプライバシーポリシーを更新いたしました。ユーザーの皆様により安心してご利用いただけるよう、セキュリティを強化しています。',
    contentEn: 'We have updated our Privacy Policy regarding personal information handling. We are strengthening security so that users can use our service with greater peace of mind.',
    isRead: true
  }
];

export default function NoticePage() {
  const { user, loading } = useAuthContext();
  const { t } = useTranslation();
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
    return date.toLocaleDateString(t.isJapanese ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold">🛎️ {t.notice.notice}</h1>
      </div>

      {/* お知らせ一覧 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4">{t.notice.noticeList}</h2>
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`p-6 border rounded-lg transition ${
              !notice.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className={`text-lg font-medium ${!notice.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                {t.isJapanese ? notice.title : notice.titleEn}
              </h3>
              {!notice.isRead && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                  {t.notice.unread}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-4">{formatDate(notice.date)}</p>
            <div className="prose max-w-none">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {t.isJapanese ? notice.content : notice.contentEn}
              </p>
            </div>
            {!notice.isRead && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => handleNoticeClick(notice)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t.notice.markAsRead}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}