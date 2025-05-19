// components/Header.tsx
"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export default function Header() {
  const { user, loading } = useAuthContext();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gray-100">
      <Link href="/" className="text-xl font-bold">GuideApp</Link>

      {!loading && (
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <span className="text-sm text-gray-700">ようこそ、{user.displayName ?? "ユーザー"} さん</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              ログイン
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
