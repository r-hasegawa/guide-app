// src/app/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { getUserBasicInfo } from "@/firebase/firestore";

export default function LoginPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // SessionWrapperで統一的にリダイレクト処理されるため、
  // ここでは成功時のリダイレクトのみ残す
  useEffect(() => {
    // ログイン成功後の適切なページへのリダイレクト
    if (!loading && user && userInfo && userInfo.profileCompleted && userInfo.activated) {
      if (userInfo.role === 'guide') {
        router.replace("/mypage");
      } else {
        router.replace("/mypage");
      }
    }
  }, [user, userInfo, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 入力値の検証
      if (!email.trim() || !password.trim()) {
        setError("メールアドレスとパスワードを入力してください。");
        return;
      }

      console.log('Attempting email login for:', email);
      
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      console.log('Email login success:', result.user.uid);
      
      // Firestoreにデータがあるかチェック
      const existingUserInfo = await getUserBasicInfo(result.user.uid);
      
      if (!existingUserInfo) {
        // Firestoreにデータがない場合はログアウト
        console.log('No Firestore data found for user');
        await auth.signOut();
        setError('ユーザーデータが見つかりません。新規登録を行ってください。');
        return;
      }
      
      // ログイン成功後はuseEffectでリダイレクト処理される
      console.log('Email login complete');
      
    } catch (err: any) {
      // 予期される認証エラーの場合はconsole.errorを使用しない
      const isAuthError = err.code && err.code.startsWith('auth/');
      
      if (isAuthError) {
        console.log('Authentication failed:', err.code); // console.logを使用
      } else {
        console.error('Unexpected error during login:', err); // 予期しないエラーのみconsole.error
      }
      
      // Firebase Auth v9以降では多くのエラーがinvalid-credentialに統合された
      if (err.code === 'auth/invalid-credential') {
        setError("メールアドレスまたはパスワードが正しくありません。");
      } else if (err.code === 'auth/user-not-found') {
        setError("このメールアドレスは登録されていません。");
      } else if (err.code === 'auth/wrong-password') {
        setError("パスワードが間違っています。");
      } else if (err.code === 'auth/invalid-email') {
        setError("メールアドレスの形式が正しくありません。");
      } else if (err.code === 'auth/too-many-requests') {
        setError("ログイン試行回数が多すぎます。しばらく待ってから再試行してください。");
      } else if (err.code === 'auth/user-disabled') {
        setError("このアカウントは無効化されています。");
      } else if (err.code === 'auth/network-request-failed') {
        setError("ネットワークエラーが発生しました。インターネット接続を確認してください。");
      } else {
        setError("ログインに失敗しました。入力内容を確認してください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      console.log('Google login attempt:', { 
        uid: result.user.uid, 
        email: result.user.email
      });
      
      // Firestoreにユーザーデータが存在するかチェック
      const existingUserInfo = await getUserBasicInfo(result.user.uid);
      
      if (!existingUserInfo) {
        // Firestoreにデータがない = 新規ユーザー
        console.log('New Google user detected, deleting Firebase Auth user');
        
        // Firebase Authからユーザーを削除
        await result.user.delete();
        
        // エラーメッセージを表示（リダイレクトなし）
        setError('ユーザーデータが見つかりません。新規登録を行ってください。');
        return;
      }
      
      // 既存ユーザーでデータが存在する場合はuseEffectでリダイレクト処理される
      console.log('Existing user login complete');
      
    } catch (err: any) {
      // 予期される認証エラーの場合はconsole.errorを使用しない
      const isAuthError = err.code && err.code.startsWith('auth/');
      
      if (isAuthError) {
        console.log('Google authentication failed:', err.code); // console.logを使用
      } else {
        console.error('Unexpected error during Google login:', err); // 予期しないエラーのみconsole.error
      }
      
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Googleログインがキャンセルされました。');
      } else if (err.code === 'auth/popup-blocked') {
        setError('ポップアップがブロックされました。ポップアップを許可してください。');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('このメールアドレスは既に別の方法で登録されています。');
      } else {
        setError("Googleログインに失敗しました。もう一度お試しください。");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">読み込み中...</div>;

  // ログイン済みの場合は何も表示しない（useEffectでリダイレクト処理中）
  if (user) return <div className="text-center py-10">リダイレクト中...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow rounded bg-white">
      <h2 className="text-xl font-bold mb-6 text-center">ログイン</h2>
      
      {/* ソーシャルログインボタン */}
      <div className="mb-6">
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Googleでログイン
        </button>
      </div>

      {/* 区切り線 */}
      <div className="flex items-center mb-6">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-sm text-gray-500">または</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* メールログインフォーム */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "ログイン中..." : "メールでログイン"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        アカウントをお持ちでない方は{" "}
        <Link href="/" className="text-blue-500 underline hover:text-blue-700">
          新規登録
        </Link>
      </div>
    </div>
  );
}