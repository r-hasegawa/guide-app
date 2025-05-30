// src/components/AdminGuard.tsx
'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return;

      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        // Firebase Auth のカスタムクレームをチェック
        const idTokenResult = await user.getIdTokenResult();
        const isAdminUser = idTokenResult.claims.admin === true;
        
        if (!isAdminUser) {
          // 管理者でない場合はマイページにリダイレクト
          router.replace('/mypage');
          return;
        }
        
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        router.replace('/mypage');
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, loading, router]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">管理者権限を確認中...</h1>
          <p className="text-gray-600">しばらくお待ちください</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">アクセス拒否</h1>
          <p className="text-gray-600 mb-6">このページにアクセスするには管理者権限が必要です。</p>
          <button
            onClick={() => router.push('/mypage')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            マイページに戻る
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}