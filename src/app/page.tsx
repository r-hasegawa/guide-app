"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

export default function HomePage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <header className="w-full max-w-4xl py-6 text-center">
        <h1 className="text-4xl font-bold">学生ガイドマッチングプラットフォーム</h1>
        <p className="mt-2 text-lg text-gray-600">学生と訪日観光客をつなぐ、リアルな言語交流体験</p>
      </header>

      <section className="mt-10 flex flex-col gap-4 w-full max-w-md">
        <Link
          href="/signup?role=guide"
          className="bg-blue-600 text-white py-3 rounded-lg text-center hover:bg-blue-700 transition"
        >
          ガイドとして登録
        </Link>
        <Link
          href="/signup?role=guest"
          className="bg-green-600 text-white py-3 rounded-lg text-center hover:bg-green-700 transition"
        >
          観光客として登録
        </Link>
        <div className="mt-6 text-center text-sm text-gray-500">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-blue-500 underline hover:text-blue-700">
            ログイン
          </Link>
        </div>
      </section>
    </main>
  );
}