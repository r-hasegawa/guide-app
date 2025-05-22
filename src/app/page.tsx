// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import Link from "next/link";

export default function HomePage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/mypage");
    }
  }, [user, loading, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <header className="w-full max-w-4xl py-6 text-center">
        <h1 className="text-4xl font-bold">学生ガイドマッチングプラットフォーム</h1>
        <p className="mt-2 text-lg text-gray-600">学生と訪日観光客をつなぐ、リアルな言語交流体験</p>
      </header>

      <section className="mt-10 flex flex-col gap-4 w-full max-w-md">
        <Link
          href="/signup?role=student"
          className="bg-blue-600 text-white py-3 rounded-lg text-center hover:bg-blue-700 transition"
        >
          学生として登録
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
