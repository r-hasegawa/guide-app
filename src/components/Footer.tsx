// src/components/Footer.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/contexts/TranslationContext";

export default function Footer() {
  const { user, userInfo } = useAuthContext();
  const { t } = useTranslation();
  const pathname = usePathname();

  // ログインページやサインアップページ、トップでは非表示
  const isTopPage = pathname === "/";
  const isLoginOrSignup = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user || isTopPage || isLoginOrSignup) return null;

  // ユーザーがガイドの場合、またはrole情報がまだロードされていない場合は、
  // ガイド検索ボタンを表示しないためのフラグ
  const isGuideUser = userInfo && userInfo.role === 'guide';

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50">
      <nav className="flex justify-around items-center h-14 text-sm text-gray-700">
        {/* ガイドではない、またはロール情報がまだロードされていない場合にのみ「ガイド検索」を表示 */}
        {!isGuideUser && (
          <Link href="/guides" className="flex flex-col items-center flex-1 py-2 border-r last:border-r-0">
            <span role="img" aria-label="search guide" className="text-xl">🔍</span>
            <span className="mt-1 text-xs sm:text-sm">{t.nav.guideSearch}</span>
          </Link>
        )}
        
        {/* ガイドの場合は4等分、それ以外は5等分になるように調整 */}
        <Link href="/posts" className={`flex flex-col items-center py-2 border-r last:border-r-0 ${isGuideUser ? 'flex-1' : 'flex-1'}`}>
          <span role="img" aria-label="recruit guide" className="text-xl">📝</span>
          <span className="mt-1 text-xs sm:text-sm">{t.nav.guideRecruitment}</span>
        </Link>
        <Link href="/chat" className={`flex flex-col items-center py-2 border-r last:border-r-0 ${isGuideUser ? 'flex-1' : 'flex-1'}`}>
          <span role="img" aria-label="chat" className="text-xl">💬</span>
          <span className="mt-1 text-xs sm:text-sm">{t.nav.chat}</span>
        </Link>
        <Link href="/requests" className={`flex flex-col items-center py-2 border-r last:border-r-0 ${isGuideUser ? 'flex-1' : 'flex-1'}`}>
          <span role="img" aria-label="manage requests" className="text-xl">📬</span>
          <span className="mt-1 text-xs sm:text-sm">{t.nav.requestManagement}</span>
        </Link>
        <Link href="/mypage" className={`flex flex-col items-center py-2 ${isGuideUser ? 'flex-1' : 'flex-1'}`}>
          <span role="img" aria-label="my page" className="text-xl">👤</span>
          <span className="mt-1 text-xs sm:text-sm">{t.nav.myPage}</span>
        </Link>
      </nav>
    </footer>
  );
}