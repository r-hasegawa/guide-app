// src/app/activation/pending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';

export default function ActivationPendingPage() {
  const { user, userInfo, loading, refreshUserInfo } = useAuthContext();
  const { t } = useTranslation();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastResendTime, setLastResendTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // クールダウンタイマー（60秒）
  const RESEND_COOLDOWN = 60000; // 60秒

  useEffect(() => {
    // SessionWrapperで基本的なリダイレクトは処理されるため、
    // ここでは認証完了後の成功時リダイレクトのみ
    if (!loading && user && userInfo && userInfo.profileCompleted && userInfo.activated) {
      router.replace('/mypage');
    }
  }, [user, userInfo, loading, router]);

  // クールダウンタイマーの更新
  useEffect(() => {
    if (lastResendTime > 0) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, RESEND_COOLDOWN - (Date.now() - lastResendTime));
        setCooldownRemaining(remaining);
        
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastResendTime]);

  const handleResendVerification = async () => {
    if (!user) return;
    
    // クールダウン中の場合は処理しない
    if (cooldownRemaining > 0) {
      const seconds = Math.ceil(cooldownRemaining / 1000);
      const message = t.isJapanese 
        ? `再送信は${seconds}秒後に可能です。`
        : `Resend available in ${seconds} seconds.`;
      setError(message);
      return;
    }

    setResending(true);
    setError('');
    
    try {
      await sendEmailVerification(user, {
        url: `${window.location.origin}/activation/complete`,
        handleCodeInApp: true
      });
      setResent(true);
      setLastResendTime(Date.now());
      setCooldownRemaining(RESEND_COOLDOWN);
      
      // 成功メッセージを3秒後に非表示
      setTimeout(() => {
        setResent(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('メール再送信エラー:', error);
      
      // エラーコードに応じたメッセージを表示
      if (error.code === 'auth/too-many-requests') {
        const message = t.isJapanese
          ? 'リクエストが多すぎます。しばらく時間をおいてから再試行してください。（通常15分～1時間程度）'
          : 'Too many requests. Please wait a while before trying again. (Usually 15 minutes to 1 hour)';
        setError(message);
        // too-many-requestsの場合は長いクールダウンを設定
        setLastResendTime(Date.now());
        setCooldownRemaining(15 * 60 * 1000); // 15分
      } else if (error.code === 'auth/invalid-email') {
        setError(t.errors.invalidEmail);
      } else if (error.code === 'auth/user-disabled') {
        const message = t.isJapanese
          ? 'このアカウントは無効化されています。サポートにお問い合わせください。'
          : 'This account has been disabled. Please contact support.';
        setError(message);
      } else {
        const message = t.isJapanese
          ? 'メールの再送信に失敗しました。しばらく待ってから再試行してください。'
          : 'Failed to resend email. Please wait a while and try again.';
        setError(message);
      }
    } finally {
      setResending(false);
    }
  };

  const handleRefreshPage = () => {
    // ユーザー情報を更新してから、ページを更新
    refreshUserInfo().then(() => {
      window.location.reload();
    });
  };

  const handleCheckStatus = async () => {
    if (!user) return;
    
    try {
      // Firebase Authの状態を再読み込み
      await user.reload();
      // AuthContextの情報も更新
      await refreshUserInfo();
      
      if (user.emailVerified) {
        // メール認証が完了している場合は自動でリダイレクト
        router.push('/activation/complete');
      } else {
        const message = t.isJapanese
          ? 'まだメール認証が完了していません。メールボックスをご確認ください。'
          : 'Email verification is not yet complete. Please check your mailbox.';
        setError(message);
      }
    } catch (error) {
      console.error('ステータス確認エラー:', error);
      setError(t.errors.loadError);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!user) {
    return null;
  }

  const formatCooldownTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    if (minutes > 0) {
      return t.isJapanese ? `${minutes}分${seconds}秒` : `${minutes}m ${seconds}s`;
    }
    return t.isJapanese ? `${seconds}秒` : `${seconds}s`;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-2">{t.auth.emailVerificationRequired}</h1>
          <p className="text-gray-600 mb-4">
            {t.isJapanese 
              ? '登録したメールアドレス宛に認証メールを送信しました。'
              : 'We have sent a verification email to your registered email address.'
            }
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{user.email}</strong><br />
              {t.isJapanese
                ? '上記のメールアドレスに送信された認証リンクをクリックして、アカウントを有効化してください。'
                : 'Please click the verification link sent to the above email address to activate your account.'
              }
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 認証状態確認ボタン */}
          <button
            onClick={handleCheckStatus}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
          >
            {t.auth.checkStatus}
          </button>

          {/* ページ更新ボタン */}
          <button
            onClick={handleRefreshPage}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            {t.auth.refreshPage}
          </button>

          {/* 認証メール再送信ボタン */}
          <button
            onClick={handleResendVerification}
            disabled={resending || cooldownRemaining > 0}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {resending 
              ? (t.isJapanese ? '送信中...' : 'Sending...')
              : cooldownRemaining > 0 
                ? (t.isJapanese 
                    ? `認証メールを再送信 (${formatCooldownTime(cooldownRemaining)}後に可能)`
                    : `Resend verification email (Available in ${formatCooldownTime(cooldownRemaining)})`)
                : t.auth.resendVerification
            }
          </button>

          {/* 成功メッセージ */}
          {resent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 text-sm">
                {t.isJapanese
                  ? '認証メールを再送信しました。メールボックスをご確認ください。'
                  : 'Verification email has been resent. Please check your mailbox.'
                }
              </p>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* ログアウトボタン */}
          <button
            onClick={handleLogout}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition"
          >
            {t.auth.logout}
          </button>
        </div>

        <div className="mt-8 space-y-4">
          <div className="text-sm text-gray-500">
            <p>
              {t.isJapanese
                ? 'メールが届かない場合は、迷惑メールフォルダもご確認ください。'
                : 'If you do not receive the email, please check your spam folder as well.'
              }
            </p>
          </div>
          
          {/* 追加のヘルプ情報 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>
                {t.isJapanese ? '認証メールが届かない場合：' : 'If verification email does not arrive:'}
              </strong><br />
              {t.isJapanese ? (
                <>
                  1. 迷惑メールフォルダを確認<br />
                  2. メールアドレスのスペルを確認<br />
                  3. 数分待ってから「認証状態を確認」をクリック<br />
                  4. それでも届かない場合は再送信をお試しください
                </>
              ) : (
                <>
                  1. Check your spam folder<br />
                  2. Verify your email address spelling<br />
                  3. Wait a few minutes and click "Check verification status"<br />
                  4. If still not received, try resending
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}