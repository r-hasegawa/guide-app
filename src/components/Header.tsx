// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";

export default function Header() {
  const { user, userInfo, loading } = useAuthContext();
  const { t, isJapanese } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
  };

  // 確認ダイアログ付きのログアウト処理
  const handleLogoutWithConfirmation = async () => {
    // 確認ダイアログを表示
    const confirmMessage = isJapanese ? 'ログアウトしますか？' : 'Are you sure you want to logout?';
    const confirmLogout = window.confirm(confirmMessage);
    
    if (!confirmLogout) {
      return; // ユーザーがキャンセルした場合は何もしない
    }
    
    try {
      console.log('ログアウト処理開始');
      await signOut(auth);
      console.log('ログアウト成功 - TOPページにリダイレクト');
      
      // TOPページにリダイレクト（replace使用で履歴を残さない）
      router.replace('/');
      
    } catch (error) {
      console.error('ログアウトエラー:', error);
      
      // エラーメッセージを表示（オプション）
      const errorMessage = isJapanese 
        ? 'ログアウト中にエラーが発生しましたが、TOPページに移動します。'
        : 'An error occurred during logout, but you will be redirected to the top page.';
      alert(errorMessage);
      
      // エラーが発生してもTOPページにリダイレクト
      router.replace('/');
    }
  };

  // 管理者の場合は専用のヘッダーを表示
  if (!loading && user && userInfo && userInfo.role === 'admin') {
    return (
      <header className="flex justify-between items-center px-6 py-4 bg-gray-800 text-white">
        <div className="text-xl font-bold">🛡️ TABIFY Admin</div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300">
            管理者: {user.email}
          </span>
          <button
            onClick={handleLogoutWithConfirmation}
            className="flex items-center space-x-1 text-gray-300 hover:text-white focus:outline-none"
            aria-label="ログアウト"
          >
            <span role="img" aria-label="logout" className="text-lg">🚪</span>
            <span className="text-sm">ログアウト</span>
          </button>
        </div>
      </header>
    );
  }

  // ユーザーステータスを組み合わせたアイコンと色を決定（一般ユーザー用）
  const getUserStatusInfo = () => {
    if (!userInfo) return { 
      icon: '👤', 
      text: t.common.loading, 
      color: 'text-gray-500' 
    };

    const role = userInfo.role === 'guide' ? t.roles.guide : t.roles.guest;
    const roleIcon = userInfo.role === 'guide' ? '🎓' : '✈️';
    
    if (!userInfo.activated) {
      const statusText = isJapanese ? `${role}(未認証)` : `${role} (Unverified)`;
      return { 
        icon: '⚠️', 
        text: statusText, 
        color: 'text-red-600',
        needsAttention: true 
      };
    }
    
    if (!userInfo.profileCompleted) {
      const statusText = isJapanese ? `${role}(設定中)` : `${role} (Setup)`;
      return { 
        icon: '📝', 
        text: statusText, 
        color: 'text-orange-600',
        needsAttention: true 
      };
    }
    
    const statusText = isJapanese ? `${role}(準備完了)` : `${role} (Ready)`;
    return { 
      icon: roleIcon, 
      text: statusText, 
      color: 'text-green-600',
      needsAttention: false 
    };
  };

  const statusInfo = user ? getUserStatusInfo() : null;

  // 一般ユーザー用のヘッダー
  return (
    <header className="flex justify-between items-center px-6 py-4 bg-gray-100">
      <Link href="/" className="text-xl text-gray-700 font-bold">TABIFY</Link>

      {!loading && (
        <div className="flex items-center">
          {user ? (
            <>
              {/* ユーザーのロールに応じたアイコンと文字表示 */}
              {userInfo && userInfo.role && userInfo.role !== 'admin' && (
                <div className="flex flex-col items-center mr-4">
                  <span className="text-lg" role="img" aria-label="user role">
                    {userInfo.role === 'guide' ? '🎓' : '✈️'}
                  </span>
                  <span className="text-xs text-gray-600">
                    {userInfo.role === 'guide' ? t.roles.guide : t.roles.guest}
                  </span>
                </div>
              )}

              {/* アクティベーション状態の表示（一般ユーザーのみ） */}
              {userInfo && userInfo.role !== 'admin' && (
                <div className="flex flex-col items-center mr-4">
                  <span className="text-lg" role="img" aria-label="activation status">
                    {userInfo.activated ? '✅' : '⚠️'}
                  </span>
                  <span className={`text-xs ${userInfo.activated ? 'text-green-600' : 'text-red-600'}`}>
                    {userInfo.activated 
                      ? (isJapanese ? '認証済み' : 'Verified')
                      : (isJapanese ? '未認証' : 'Unverified')
                    }
                  </span>
                </div>
              )}

              {/* ログアウトボタンをアイコンと文字で表示 */}
              <button
                onClick={handleLogoutWithConfirmation}
                className="flex flex-col items-center text-gray-700 hover:text-red-600 focus:outline-none"
                aria-label={t.nav.logout}
              >
                <span role="img" aria-label="logout" className="text-xl">🚪</span>
                <span className="text-xs text-gray-600 mt-0.5">{t.nav.logout}</span>
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