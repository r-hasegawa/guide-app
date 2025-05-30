// src/app/mypage/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/TranslationContext';
import { Button } from '@/components/ui/button';

export default function MyPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="max-w-md mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">{t.nav.myPage}</h1>
      <div className="flex flex-col gap-4">
        <Button onClick={() => router.push('/mypage/profile')}>
          📄 {t.profile.profileView}
        </Button>
        <Button onClick={() => router.push('/mypage/notice')}>
          🛎️ {t.nav.notice}
        </Button>
        <Button onClick={() => router.push('/mypage/setting')}>
          ⚙️ {t.nav.settings}
        </Button>
        <Button onClick={() => router.push('/mypage/help')}>
          ❓ {t.nav.help}
        </Button>
      </div>
    </div>
  );
}