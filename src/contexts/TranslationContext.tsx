// src/contexts/TranslationContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Language, TranslationKeys } from '@/types/translation';
import { ja } from '@/translations/ja';
import { en } from '@/translations/en';

interface TranslationContextType {
  language: Language;
  t: TranslationKeys;
  isJapanese: boolean;
  isEnglish: boolean;
}

const TranslationContext = createContext<TranslationContextType>({
  language: 'ja',
  t: ja,
  isJapanese: true,
  isEnglish: false,
});

const translations = {
  ja,
  en,
};

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { userInfo } = useAuthContext();
  
  // ユーザーがログインしていない場合は日本語をデフォルトとする
  const language: Language = userInfo?.language || 'ja';
  const t = translations[language];
  
  const contextValue: TranslationContextType = {
    language,
    t,
    isJapanese: language === 'ja',
    isEnglish: language === 'en',
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

// 便利なフック - 翻訳キーを直接取得
export function useT() {
  const { t } = useTranslation();
  return t;
}