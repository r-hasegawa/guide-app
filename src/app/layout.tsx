// app/layout.tsx
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
