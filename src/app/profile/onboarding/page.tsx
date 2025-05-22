"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export default function LoginPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && userInfo) {
      // プロフィールが完了している場合はマイページへ
      if (userInfo.profileCompleted) {
        router.replace("/mypage");
      } else {
        // プロフィールが未完了の場合はオンボーディングへ
        router.replace("/profile/onboarding");
      }
    }
  }, [user, userInfo, loading, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ログイン成功後は useEffect でリダイレクト処理される
    } catch (err: any) {
      console.error("ログインエラー:", err);
      setError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">読み込み中...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 shadow rounded bg-white">
      <h2 className="text-xl font-bold mb-4">ログイン</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="email"
          placeholder="メールアドレス"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
}