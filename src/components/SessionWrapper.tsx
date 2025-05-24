"use client"; // クライアントサイドのフックを使用するため、'use client' ディレクティブが必要です。

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

// 認証を必要としない公開パスのリストを定義します。
const PUBLIC_PATHS = [
  '/',        // トップページ
  '/login',   // ログインページ
  '/signup',  // サインアップページ
  '/activation/pending',   // アクティベーション待機ページ
  '/activation/complete',  // アクティベーション完了ページ
];

// プロフィールオンボーディングページのパスを定義します。
const ONBOARDING_PATH = '/profile/onboarding';

export function SessionWrapper({ children }: { children: React.ReactNode }) {
  const { user, userInfo, loading } = useAuthContext(); // 認証コンテキストからユーザー情報、付随情報、ロード状態を取得
  const router = useRouter();       // Next.jsのルーターフック
  const pathname = usePathname();   // 現在のパス名を取得するフック

  useEffect(() => {
    // 認証状態のロード中であれば、何もせずに処理を終了します。
    // これにより、フリッカーや不適切なリダイレクトを防ぎます。
    if (loading) {
      return;
    }

    console.log('SessionWrapper check:', { 
      user: !!user, 
      userInfo: userInfo,
      pathname,
      profileCompleted: userInfo?.profileCompleted,
      activated: userInfo?.activated
    });

    // --- 未ログイン状態のリダイレクトロジック ---
    // ユーザーがログインしておらず (userがnull)、かつ現在のパスが公開パスリストに含まれていない場合
    // ログインページにリダイレクトします。
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      console.log('Redirecting to login: not authenticated');
      router.replace('/login'); // replaceを使用することで、ブラウザの履歴に残りません。
      return;
    }

    // ==========================================
    // ログイン済みユーザーのリダイレクト優先順位
    // ==========================================
    
    // 【最優先】プロフィール未完了 → オンボーディング
    // アクティベーション状態に関係なく、プロフィール設定を最優先
    if (user && userInfo && !userInfo.profileCompleted && pathname !== ONBOARDING_PATH) {
      console.log('Redirecting to onboarding: profile incomplete');
      router.replace(ONBOARDING_PATH);
      return;
    }

    // 【次の優先】アクティベーション未完了 → 認証待機ページ
    // プロフィール完了済みの場合のみチェック
    if (user && userInfo && userInfo.profileCompleted && !userInfo.activated && pathname !== '/activation/pending') {
      console.log('Redirecting to activation pending: not activated');
      router.replace('/activation/pending');
      return;
    }

    // --- プロフィール完了済みユーザーのオンボーディングページからのリダイレクトロジック ---
    // ユーザーがログインしており、userInfoが利用可能で、プロフィールが完了済み (profileCompletedがtrue) かつ、
    // 現在のパスがオンボーディングページである場合
    // マイページにリダイレクトします。
    // これにより、すでにオンボーディングを完了しているユーザーが再度オンボーディングページにアクセスするのを防ぎます。
    if (user && userInfo && userInfo.profileCompleted && userInfo.activated && pathname === ONBOARDING_PATH) {
      console.log('Redirecting from onboarding to mypage: already completed');
      router.replace('/mypage');
      return;
    }

  }, [loading, user, userInfo, pathname, router]); // 依存配列: これらの値が変更されたときにuseEffectが再実行されます。

  // 認証状態の確認中は、ローディングメッセージを表示します。
  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.14)*2)] items-center justify-center">
        <div className="text-center">認証状態を確認中...</div>
      </div>
    );
  }

  // すべての認証チェックを通過したか、または公開パスである場合に子コンポーネント（ページコンテンツ）をレンダリングします。
  // 公開ページでもヘッダー/フッターは表示されるようにします。
  return (
    <>
      {children}
    </>
  );
}