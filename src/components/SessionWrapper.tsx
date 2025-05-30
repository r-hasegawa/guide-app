"use client"; // クライアントサイドのフックを使用するため、'use client' ディレクティブが必要です。

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

// 認証を必要としない公開パスのリストを定義します。
const PUBLIC_PATHS = [
  '/',        // トップページ
  '/login',   // ログインページ
  '/signup',  // サインアップページ
];

// プロフィールオンボーディングページのパスを定義します。
const ONBOARDING_PATH = '/profile/onboarding';

const ACTIVATION_PATH = [
  '/activation/pending',   // アクティベーション待機ページ
  '/activation/complete',  // アクティベーション完了ページ
];

// 管理者専用パス
const ADMIN_PATHS = [
  '/admin',
];

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
      activated: userInfo?.activated,
      role: userInfo?.role
    });

    // --- 未ログイン状態のリダイレクトロジック ---
    // ユーザーがログインしておらず (userがnull)、かつ現在のパスが公開パスリストに含まれていない場合
    // トップページにリダイレクトします。
    if (!user && !PUBLIC_PATHS.includes(pathname)) {
      console.log('Redirecting to login: not authenticated');
      router.replace('/'); // replaceを使用することで、ブラウザの履歴に残りません。
      return;
    }

    // ==========================================
    // 管理者ユーザーの制御
    // ==========================================
    
    if (user && userInfo && userInfo.role === 'admin') {
      // 管理者は管理画面以外にアクセスできない
      if (!ADMIN_PATHS.includes(pathname)) {
        console.log('Redirecting admin to admin page');
        router.replace('/admin');
        return;
      }
      // 管理者の場合はここで処理終了（他の制御をスキップ）
      return;
    }

    // ==========================================
    // 一般ユーザー（guide/guest）のリダイレクト優先順位
    // ==========================================

    // 【最優先】アクティベーション未完了 → 認証待機ページ
    if (user && userInfo && !userInfo.activated && pathname !== '/activation/pending') {
      console.log('Redirecting to activation pending: not activated');
      router.replace('/activation/pending');
      return;
    }
    
    // 【次の優先】プロフィール未完了 → オンボーディング
    // アクティベーション状態の場合は、プロフィール設定へ
    if (user && userInfo && !userInfo.profileCompleted && userInfo.activated && pathname !== ONBOARDING_PATH) {
      console.log('Redirecting to onboarding: profile incomplete');
      router.replace(ONBOARDING_PATH);
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

    // 一般ユーザーが管理者ページにアクセスしようとした場合
    if (user && userInfo && userInfo.role !== 'admin' && ADMIN_PATHS.includes(pathname)) {
      console.log('Non-admin user trying to access admin page, redirecting to mypage');
      router.replace('/mypage');
      return;
    }

    // ガイドのアクセス制限
    if (user && userInfo?.role === 'guide') {
      // ガイドがアクセスできないページ
      if (pathname.startsWith('/guides')) {
        console.log('ガイドはガイド関連ページにアクセスできません');
        router.replace('/mypage');
        return;
      }
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