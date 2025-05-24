'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { useAuthContext } from '@/contexts/AuthContext';

export default function ActivationPendingPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // SessionWrapperで基本的なリダイレクトは処理されるため、
    // ここでは認証完了後の成功時リダイレクトのみ
    if (!loading && user && userInfo && userInfo.profileCompleted && userInfo.activated) {
      router.replace('/mypage');
    }
  }, [user, userInfo, loading, router]);

  const handleResendVerification = async () => {
    if (!user) return;

    setResending(true);
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/activation/complete`,
        handleCodeInApp: true
      });
      setResent(true);
    } catch (error) {
      console.error('メール再送信エラー:', error);
      alert('メールの再送信に失敗しました。しばらく待ってから再試行してください。');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-2">メールアドレスの認証が必要です</h1>
          <p className="text-gray-600 mb-4">
            登録したメールアドレス宛に認証メールを送信しました。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{user.email}</strong><br />
              上記のメールアドレスに送信された認証リンクをクリックして、アカウントを有効化してください。
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {resending ? '送信中...' : '認証メールを再送信'}
          </button>

          {resent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                認証メールを再送信しました。メールボックスをご確認ください。
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition"
          >
            ログアウト
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>メールが届かない場合は、迷惑メールフォルダもご確認ください。</p>
        </div>
      </div>
    </main>
  );
}