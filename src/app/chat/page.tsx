// src/app/chat/page.tsx
'use client';

import { useTranslation } from '@/contexts/TranslationContext';

export default function ChatPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">💬 {t.chat.chatList}</h1>
      <p>
        {t.isJapanese 
          ? 'マッチング中の相手とのチャット一覧を表示します（今後実装）'
          : 'Display chat list with matched partners (to be implemented)'
        }
      </p>
    </div>
  );
}