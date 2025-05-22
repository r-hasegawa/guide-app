// components/Header.tsx
"use client";

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export default function Header() {
  const { user, userInfo, loading } = useAuthContext();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gray-100">
      <Link href="/" className="text-xl text-gray-700 font-bold">TABIFY</Link>

      {!loading && (
        <div className="flex items-center">
          {user ? (
            <>
              {/* ユーザーのロールに応じたアイコンと文字表示 */}
              {userInfo && userInfo.role && (
                <div className="flex flex-col items-center mr-4"> {/* flex-colとmr-4を追加 */}
                  <span className="text-lg" role="img" aria-label="user role">
                    {userInfo.role === 'guide' ? '🎓' : '✈️'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {userInfo.role === 'guide' ? 'ガイド' : '観光客'}
                  </span>
                </div>
              )}

              {/* ログアウトボタンをアイコンと文字で表示 */}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center text-gray-700 hover:text-red-600 focus:outline-none"
                aria-label="ログアウト"
              >
                <span role="img" aria-label="logout" className="text-xl">🚪</span>
                <span className="text-xs text-gray-600 mt-0.5">ログアウト</span> {/* mt-0.5で少しマージン */}
              </button>
            </>
          ) : (
            // 未ログイン時は何も表示しない
            null
          )}
        </div>
      )}
    </header>
  );
}