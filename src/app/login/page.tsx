// src/app/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export default function LoginPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user && userInfo) {
      // ユーザー情報が存在するかチェック
      if (userInfo.profileCompleted) {
        // プロフィール完了済み → マイページへ
        router.replace("/mypage");
      } else {
        // プロフィール未完了 → オンボーディングへ
        router.replace("/profile/onboarding");
      }
    } else if (!loading && user && !userInfo) {
      // ログインしているがuserInfoがない場合（新規ユーザー）→ オンボーディングへ
      router.replace("/profile/onboarding");
    }
  }, [user, userInfo, loading, router]);

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ログイン成功後はuseEffectでリダイレクト処理される
    } catch (err: any) {
      console.error("ログインエラー:", err);
      if (err.code === 'auth/user-not-found') {
        setError("このメールアドレスは登録されていません。");
      } else if (err.code === 'auth/wrong-password') {
        setError("パスワードが間違っています。");
      } else if (err.code === 'auth/invalid-email') {
        setError("メールアドレスの形式が正しくありません。");
      } else {
        setError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
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
      await signInWithPopup(auth, provider);
      // ログイン成功後はuseEffectでリダイレクト処理される
    } catch (err: any) {
      console.error("Googleログインエラー:", err);
      setError("Googleログインに失敗しました。");
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
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          新規登録
        </a>
      </div>
    </div>
  );
}