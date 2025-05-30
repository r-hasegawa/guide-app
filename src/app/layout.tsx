// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { SessionWrapper } from "@/components/SessionWrapper";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "TABIFY - Student Guide Matching Platform",
  description: "Connect students and tourists for real language exchange experiences",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="pb-14">
        <AuthProvider>
          <TranslationProvider>
            <Header />
            <SessionWrapper>
              <main>{children}</main>
            </SessionWrapper>
            <Footer />
          </TranslationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}