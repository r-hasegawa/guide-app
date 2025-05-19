// src/app/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export default function LoginPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/profile/view");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/profile/view");
    } catch (err: any) {
      setError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。");
    }
  };

  if (loading) return <div>読み込み中...</div>;

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
        />
        <input
          type="password"
          placeholder="パスワード"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          ログイン
        </button>
      </form>
    </div>
  );
}
