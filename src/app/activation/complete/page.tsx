'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { updateActivationStatus } from '@/firebase/firestore';

export default function ActivationCompletePage() {
  const { user, userInfo, loading, refreshUserInfo } = useAuthContext();
  const router = useRouter();
  const [activating, setActivating] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleActivation = async () => {
      if (loading) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        // Firebase Authの状態を更新（メール認証を確認）
        await user.reload();
        
        console.log('Email verification status:', user.emailVerified);
        
        if (user.emailVerified) {
          // Firestoreのactivatedフィールドを更新
          await updateActivationStatus(user.uid, true);

          console.log('Updated activated status in Firestore');

          // AuthContextの情報を更新
          await refreshUserInfo();

          // 少し待ってからリダイレクト（状態更新の時間を確保）
          setTimeout(() => {
            // プロフィール未完了の場合はオンボーディングへ
            if (userInfo && !userInfo.profileCompleted) {
              router.replace('/profile/onboarding');
            } else {
              // プロフィール完了済みの場合はマイページへ
              router.replace('/mypage');
            }
          }, 1000);
        } else {
          setError('メール認証が完了していません。認証リンクをクリックしてください。');
        }
      } catch (error) {
        console.error('アクティベーション処理エラー:', error);
        setError('アクティベーション処理中にエラーが発生しました。');
      } finally {
        setActivating(false);
      }
    };

    handleActivation();
  }, [user, userInfo, loading, router, refreshUserInfo]);

  if (loading || activating) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">アカウントを有効化しています</h1>
          <p className="text-gray-600">しばらくお待ちください...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">アクティベーションエラー</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/activation/pending')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              認証ページに戻る
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition"
            >
              トップページに戻る
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">アクティベーション完了</h1>
        <p className="text-gray-600">アカウントが有効化されました。リダイレクト中...</p>
      </div>
    </main>
  );
}