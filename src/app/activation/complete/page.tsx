// src/app/activation/complete/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';

export default function ActivationCompletePage() {
  const { user, userInfo, loading, refreshUserInfo } = useAuthContext();
  const { t, isJapanese } = useTranslation();
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
          console.log('Email verified successfully');

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
          setError(t.errors.emailNotVerified);
        }
      } catch (error) {
        console.error('アクティベーション処理エラー:', error);
        setError(t.errors.activationError);
      } finally {
        setActivating(false);
      }
    };

    handleActivation();
  }, [user, userInfo, loading, router, refreshUserInfo, t]);

  if (loading || activating) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">
            {isJapanese ? 'アカウントを有効化しています' : 'Activating your account'}
          </h1>
          <p className="text-gray-600">
            {isJapanese ? 'しばらくお待ちください...' : 'Please wait...'}
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">{t.auth.activationError}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/activation/pending')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
            >
              {isJapanese ? '認証ページに戻る' : 'Back to verification page'}
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition"
            >
              {isJapanese ? 'トップページに戻る' : 'Back to top page'}
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
        <h1 className="text-2xl font-bold mb-2">{t.auth.activationComplete}</h1>
        <p className="text-gray-600">
          {isJapanese 
            ? 'アカウントが有効化されました。リダイレクト中...'
            : 'Your account has been activated. Redirecting...'
          }
        </p>
      </div>
    </main>
  );
}