// src/app/mypage/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function MyPage() {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">マイページ</h1>
      <div className="flex flex-col gap-4">
        <Button onClick={() => router.push('/mypage/profile')}>📄 プロフィール閲覧</Button>
        <Button onClick={() => router.push('/mypage/notice')}>🛎️ お知らせ</Button>
        <Button onClick={() => router.push('/mypage/setting')}>⚙️ 各種設定</Button>
        <Button onClick={() => router.push('/mypage/help')}>❓ ヘルプ</Button>
      </div>
    </div>
  );
}
