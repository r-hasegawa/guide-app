"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Footer() {
  const { user } = useAuthContext();
  const pathname = usePathname();

  // ログインページやサインアップページ、トップでは非表示
  const isTopPage = pathname === "/";
  const isLoginOrSignup = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user || isTopPage || isLoginOrSignup) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50">
      <nav className="flex justify-around items-center h-14 text-sm">
        <Link href="/guides" className="flex flex-col items-center">
          <span>ガイド検索</span>
        </Link>
        <Link href="/posts" className="flex flex-col items-center">
          <span>ガイド募集</span>
        </Link>
        <Link href="/chat" className="flex flex-col items-center">
          <span>チャット</span>
        </Link>
        <Link href="/requests" className="flex flex-col items-center">
          <span>申請管理</span>
        </Link>
        <Link href="/mypage" className="flex flex-col items-center">
          <span>マイページ</span>
        </Link>
      </nav>
    </footer>
  );
}
