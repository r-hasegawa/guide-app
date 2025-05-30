// src/app/mypage/setting/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';
import { updateUserSettings } from '@/firebase/firestore';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
  };
  language: 'ja' | 'en';
}

export default function SettingPage() {
  const { user, userInfo, loading, refreshUserInfo } = useAuthContext();
  const { t } = useTranslation();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: true
    },
    language: 'ja'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    // userInfoから現在の設定を読み込み
    if (userInfo) {
      console.log('Loading user settings from userInfo:', userInfo);
      
      setSettings({
        notifications: {
          email: userInfo.notifications?.email ?? true,
          push: userInfo.notifications?.push ?? true
        },
        language: userInfo.language ?? 'ja'
      });
      
      console.log('Settings loaded:', {
        notifications: {
          email: userInfo.notifications?.email ?? true,
          push: userInfo.notifications?.push ?? true
        },
        language: userInfo.language ?? 'ja'
      });
    }
  }, [user, userInfo, loading, router]);

  const handleEmailNotificationToggle = () => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        email: !prev.notifications.email
      }
    }));
  };

  const handlePushNotificationToggle = () => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        push: !prev.notifications.push
      }
    }));
  };

  const handleLanguageChange = (language: 'ja' | 'en') => {
    setSettings(prev => ({
      ...prev,
      language
    }));
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await updateUserSettings(user.uid, settings);
      
      // AuthContextの情報を更新
      await refreshUserInfo();
      
      // 言語変更時は即座に反映されるよう、ページをリロード
      if (settings.language !== userInfo?.language) {
        window.location.reload();
      } else {
        alert(t.success.settingsSaved);
      }
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      alert(t.errors.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!user) {
    return null;
  }

  if (!userInfo) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-blue-500 hover:text-blue-700"
        >
          ← {t.common.back}
        </button>
        <h1 className="text-2xl font-bold">⚙️ {t.settings.settings}</h1>
      </div>

      <div className="space-y-6">
        {/* 通知設定 */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">🔔 {t.settings.notifications}</h2>
          
          <div className="space-y-6">
            {/* メール通知のON/OFF */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{t.settings.emailNotifications}</h3>
                <p className="text-sm text-gray-600">{t.settings.emailNotificationDesc}</p>
              </div>
              <button
                onClick={handleEmailNotificationToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.email ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* プッシュ通知のON/OFF */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{t.settings.pushNotifications}</h3>
                <p className="text-sm text-gray-600">{t.settings.pushNotificationDesc}</p>
              </div>
              <button
                onClick={handlePushNotificationToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications.push ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 言語設定 */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">🌐 {t.settings.languageSettings}</h2>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                checked={settings.language === 'ja'}
                onChange={() => handleLanguageChange('ja')}
                className="mr-3"
              />
              <span>日本語</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                checked={settings.language === 'en'}
                onChange={() => handleLanguageChange('en')}
                className="mr-3"
              />
              <span>English</span>
            </label>
          </div>
        </div>

        {/* 設定保存ボタン */}
        <div className="flex justify-end">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSaving ? t.common.processing : t.settings.saveSettings}
          </button>
        </div>

        {/* その他のページへのリンク */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">📄 {t.settings.supportInfo}</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/mypage/setting/company')}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{t.settings.companyInfo}</h3>
                  <p className="text-sm text-gray-600">
                    {t.isJapanese ? '運営会社についての情報' : 'Information about the operating company'}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/mypage/setting/terms')}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{t.settings.termsOfService}</h3>
                  <p className="text-sm text-gray-600">
                    {t.isJapanese ? 'サービス利用に関する規約' : 'Terms and conditions for service use'}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </button>

            <button
              onClick={() => router.push('/mypage/setting/privacy')}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{t.settings.privacyPolicy}</h3>
                  <p className="text-sm text-gray-600">
                    {t.isJapanese ? '個人情報の取り扱いについて' : 'How we handle personal information'}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}