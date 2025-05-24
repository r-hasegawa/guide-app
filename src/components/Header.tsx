// components/Header.tsx (コンパクト版)
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

  // ユーザーステータスを組み合わせたアイコンと色を決定
  const getUserStatusInfo = () => {
    if (!userInfo) return { icon: '👤', text: 'ロード中', color: 'text-gray-500' };

    const role = userInfo.role === 'guide' ? 'ガイド' : '観光客';
    const roleIcon = userInfo.role === 'guide' ? '🎓' : '✈️';
    
    if (!userInfo.activated) {
      return { 
        icon: '⚠️', 
        text: `${role}(未認証)`, 
        color: 'text-red-600',
        needsAttention: true 
      };
    }
    
    if (!userInfo.profileCompleted) {
      return { 
        icon: '📝', 
        text: `${role}(設定中)`, 
        color: 'text-orange-600',
        needsAttention: true 
      };
    }
    
    return { 
      icon: roleIcon, 
      text: `${role}(準備完了)`, 
      color: 'text-green-600',
      needsAttention: false 
    };
  };

  const statusInfo = user ? getUserStatusInfo() : null;

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gray-100">
      <Link href="/" className="text-xl text-gray-700 font-bold">TABIFY</Link>

      {!loading && (
        <div className="flex items-center">
          {user ? (
            <>
              {/* ユーザーのロールに応じたアイコンと文字表示 */}
              {userInfo && userInfo.role && (
                <div className="flex flex-col items-center mr-4">
                  <span className="text-lg" role="img" aria-label="user role">
                    {userInfo.role === 'guide' ? '🎓' : '✈️'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {userInfo.role === 'guide' ? 'ガイド' : '観光客'}
                  </span>
                </div>
              )}

              {/* アクティベーション状態の表示 */}
              {userInfo && (
                <div className="flex flex-col items-center mr-4">
                  <span className="text-lg" role="img" aria-label="activation status">
                    {userInfo.activated ? '✅' : '⚠️'}
                  </span>
                  <span className={`text-xs ${userInfo.activated ? 'text-green-600' : 'text-red-600'}`}>
                    {userInfo.activated ? '認証済み' : '未認証'}
                  </span>
                </div>
              )}

              {/* プロフィール完了状態の表示 */}
              {/*{userInfo && (
                <div className="flex flex-col items-center mr-4">
                  <span className="text-lg" role="img" aria-label="profile status">
                    {userInfo.profileCompleted ? '👤' : '📝'}
                  </span>
                  <span className={`text-xs ${userInfo.profileCompleted ? 'text-blue-600' : 'text-orange-600'}`}>
                    {userInfo.profileCompleted ? '完了' : '設定中'}
                  </span>
                </div>
              )}*/}

              {/* ログアウトボタンをアイコンと文字で表示 */}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center text-gray-700 hover:text-red-600 focus:outline-none"
                aria-label="ログアウト"
              >
                <span role="img" aria-label="logout" className="text-xl">🚪</span>
                <span className="text-xs text-gray-600 mt-0.5">ログアウト</span>
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