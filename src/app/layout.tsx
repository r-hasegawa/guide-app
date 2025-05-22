// src/app/layout.tsx
import type { Metadata } from "next";
// Inter フォントのインポートを削除
import "./globals.css";
// 元の AuthProvider の名前とインポート方法に合わせる
import { AuthProvider } from "@/contexts/AuthContext";
// SessionWrapper は main コンテンツのみをラップするようにする
import { SessionWrapper } from "@/components/SessionWrapper";
// Header と Footer は元のインポート方法に合わせる
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Inter フォントの定義を削除

export const metadata: Metadata = {
  title: "Your App Title", // アプリケーションのタイトルを適切に設定してください
  description: "Your App Description", // アプリケーションの説明を適切に設定してください
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      {/* bodyタグのクラス名を元のpb-14のみに戻す。Interフォントのクラスは削除。 */}
      <body className="pb-14">
        {/* AuthProviderでアプリケーション全体をラップ */}
        <AuthProvider>
          {/* HeaderはSessionWrapperの外で直接レンダリング */}
          <Header />
          {/* SessionWrapperでchildren（各ページのコンテンツ）のみをラップ */}
          <SessionWrapper>
            <main>{children}</main> {/* mainタグでページコンテンツをラップ */}
          </SessionWrapper>
          {/* FooterはSessionWrapperの外で直接レンダリング */}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}