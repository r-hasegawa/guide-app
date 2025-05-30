// src/app/mypage/help/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/TranslationContext';

export default function HelpPage() {
  const { user, userInfo, loading } = useAuthContext();
  const { t } = useTranslation();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>([]);

  if (loading) {
    return <div className="text-center py-10">{t.common.loading}</div>;
  }

  if (!user) {
    router.replace('/login');
    return null;
  }

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isOpen = (section: string) => openSections.includes(section);

  const handleWithdraw = () => {
    const message = t.isJapanese 
      ? '退会機能は現在準備中です。サポートまでお問い合わせください。'
      : 'Account deletion feature is currently under development. Please contact support.';
    alert(message);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-blue-500 hover:text-blue-700"
        >
          ← {t.common.back}
        </button>
        <h1 className="text-2xl font-bold">❓ {t.help.help}</h1>
      </div>

      <div className="space-y-4">
        {/* アプリの使い方 */}
        <div className="bg-white border rounded-lg">
          <button
            onClick={() => toggleSection('usage')}
            className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">📖</span>
              <h2 className="text-lg font-semibold">{t.help.howToUse}</h2>
            </div>
            <span className={`transform transition-transform ${isOpen('usage') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isOpen('usage') && (
            <div className="px-6 pb-6 border-t bg-gray-50">
              {userInfo?.role === 'guide' ? (
                <div className="space-y-6 pt-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">🎓 {t.help.howToUseAsGuide}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '1. プロフィール設定' : '1. Profile Setup'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese 
                            ? 'マイページ → プロフィール編集から、対応言語、エリア、自己紹介を設定してください。詳細なプロフィールがあると、観光客からのリクエストが増えやすくなります。'
                            : 'Go to My Page → Edit Profile to set your supported languages, areas, and self-introduction. A detailed profile helps attract more requests from tourists.'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '2. ガイド募集への応募' : '2. Apply to Guide Jobs'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? '「ガイド募集」ページで観光客が投稿した募集を確認し、興味のある案件に応募できます。応募時には自己紹介や対応可能な内容を詳しく記載しましょう。'
                            : 'Check job postings by tourists on the "Guide Jobs" page and apply to cases that interest you. Include detailed self-introduction and what you can offer when applying.'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '3. リクエストの管理' : '3. Manage Requests'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? '「申請管理」ページで観光客からの直接リクエストを確認・承認できます。リクエストには迅速に対応することを心がけましょう。'
                            : 'Check and approve direct requests from tourists on the "Request Management" page. Try to respond to requests promptly.'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '4. チャットでのやり取り' : '4. Chat Communication'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? 'マッチングが成立した相手とは「チャット」機能でやり取りができます。待ち合わせ場所や時間の調整を行いましょう。'
                            : 'You can communicate with matched partners using the "Chat" feature. Coordinate meeting places and times.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">✈️ {t.help.howToUseAsGuest}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '1. プロフィール設定' : '1. Profile Setup'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? 'マイページ → プロフィール編集から、話せる言語、自己紹介を設定してください。ガイドがあなたのことを理解しやすくなります。'
                            : 'Go to My Page → Edit Profile to set your spoken languages and self-introduction. This helps guides understand you better.'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '2. ガイドの検索' : '2. Search for Guides'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? '「ガイド検索」ページで条件に合うガイドを探し、直接リクエストを送ることができます。希望する日時や内容を詳しく伝えましょう。'
                            : 'Find guides that match your criteria on the "Find Guides" page and send direct requests. Clearly communicate your preferred dates and activities.'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '3. 募集投稿の作成' : '3. Create Job Postings'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? '「ガイド募集」ページで新しい募集を作成し、複数のガイドから応募を受け取ることができます。具体的な希望を記載すると良い応募が集まりやすくなります。'
                            : 'Create new job postings on the "Guide Jobs" page and receive applications from multiple guides. Specific requirements help attract better applications.'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">
                          {t.isJapanese ? '4. 応募の管理' : '4. Manage Applications'}
                        </h4>
                        <p className="text-gray-700 ml-4">
                          {t.isJapanese
                            ? '「申請管理」ページでガイドからの応募を確認・承認できます。プロフィールを確認して最適なガイドを選びましょう。'
                            : 'Check and approve applications from guides on the "Request Management" page. Review profiles to choose the best guide for you.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* よくある質問 */}
        <div className="bg-white border rounded-lg">
          <button
            onClick={() => toggleSection('faq')}
            className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">❓</span>
              <h2 className="text-lg font-semibold">{t.help.faq}</h2>
            </div>
            <span className={`transform transition-transform ${isOpen('faq') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isOpen('faq') && (
            <div className="px-6 pb-6 border-t bg-gray-50">
              <div className="space-y-6 pt-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'Q. メール認証が完了しません' : 'Q. Email verification is not completing'}
                  </h3>
                  <p className="text-gray-700 ml-4">
                    {t.isJapanese
                      ? 'A. 迷惑メールフォルダをご確認ください。メールが届かない場合は、認証メールの再送信をお試しください。それでも解決しない場合は、正しいメールアドレスが登録されているか確認してください。'
                      : 'A. Please check your spam folder. If you don\'t receive the email, try resending the verification email. If the issue persists, verify that the correct email address is registered.'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'Q. プロフィール情報を変更したい' : 'Q. I want to change my profile information'}
                  </h3>
                  <p className="text-gray-700 ml-4">
                    {t.isJapanese
                      ? 'A. マイページ → プロフィール → 編集から情報を変更できます。変更した内容は保存ボタンを押すと即座に反映されます。'
                      : 'A. You can change your information from My Page → Profile → Edit. Changes are reflected immediately when you press the save button.'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'Q. マッチングが成立した後のキャンセルはできますか？' : 'Q. Can I cancel after matching is established?'}
                  </h3>
                  <p className="text-gray-700 ml-4">
                    {t.isJapanese
                      ? 'A. 緊急事態や体調不良など、やむを得ない理由でのキャンセルは可能ですが、相手にできるだけ早く連絡を取り、誠意を持って対応してください。頻繁なキャンセルはアカウント制限の対象となる場合があります。'
                      : 'A. Cancellation is possible for unavoidable reasons such as emergencies or illness, but please contact the other party as soon as possible and respond sincerely. Frequent cancellations may result in account restrictions.'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'Q. 料金の支払い方法は？' : 'Q. What are the payment methods?'}
                  </h3>
                  <p className="text-gray-700 ml-4">
                    {t.isJapanese
                      ? 'A. 現在は当事者間での直接のやり取りとなります。事前にガイド料金や支払い方法について相談し、合意の上で進めてください。将来的にはアプリ内決済機能の実装を予定しています。'
                      : 'A. Currently, payment is handled directly between parties. Please discuss guide fees and payment methods in advance and proceed with mutual agreement. We plan to implement in-app payment features in the future.'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'Q. 不適切なユーザーを報告したい' : 'Q. I want to report inappropriate users'}
                  </h3>
                  <p className="text-gray-700 ml-4">
                    {t.isJapanese
                      ? 'A. 不適切な行為や迷惑行為を受けた場合は、速やかにサポートまでご連絡ください。チャットのスクリーンショットなど、証拠となる情報があると調査がスムーズに進みます。'
                      : 'A. If you experience inappropriate behavior or harassment, please contact support immediately. Evidence such as chat screenshots will help with the investigation.'
                    }
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'Q. パスワードを忘れてしまいました' : 'Q. I forgot my password'}
                  </h3>
                  <p className="text-gray-700 ml-4">
                    {t.isJapanese
                      ? 'A. ログイン画面の「パスワードを忘れた方」のリンクから、パスワードリセット用のメールを送信できます。メールに記載されたリンクから新しいパスワードを設定してください。'
                      : 'A. You can send a password reset email from the "Forgot password?" link on the login screen. Set a new password from the link provided in the email.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 退会について */}
        <div className="bg-white border rounded-lg">
          <button
            onClick={() => toggleSection('withdraw')}
            className="w-full text-left p-6 flex items-center justify-between hover:bg-gray-50 transition"
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <h2 className="text-lg font-semibold text-red-600">{t.help.withdrawal}</h2>
            </div>
            <span className={`transform transition-transform ${isOpen('withdraw') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isOpen('withdraw') && (
            <div className="px-6 pb-6 border-t bg-red-50">
              <div className="space-y-6 pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">{t.help.withdrawalPrecautions}</h3>
                  <ul className="text-yellow-700 space-y-1 ml-4">
                    <li>
                      • {t.isJapanese 
                          ? '退会すると全てのデータが削除され、復元できません'
                          : 'All data will be deleted upon withdrawal and cannot be restored'
                        }
                    </li>
                    <li>
                      • {t.isJapanese
                          ? '進行中のマッチングがある場合は、事前に相手に連絡してください'
                          : 'If you have ongoing matches, please contact the other party in advance'
                        }
                    </li>
                    <li>
                      • {t.isJapanese
                          ? '退会後は同じメールアドレスでの再登録ができません'
                          : 'Re-registration with the same email address is not possible after withdrawal'
                        }
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? '退会手続きについて' : 'About Withdrawal Procedure'}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {t.isJapanese
                      ? '退会をご希望の場合は、以下のボタンから手続きを開始してください。退会理由をお聞かせいただけると、サービス改善に役立てさせていただきます。'
                      : 'If you wish to withdraw, please start the procedure from the button below. If you could share your reason for withdrawal, it would help us improve our service.'
                    }
                  </p>
                  
                  <button
                    onClick={handleWithdraw}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
                  >
                    {t.help.startWithdrawal}
                  </button>
                </div>
                
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">
                    {t.isJapanese ? 'お困りのことがあれば' : 'If you have any issues'}
                  </h3>
                  <p className="text-gray-700">
                    {t.isJapanese
                      ? 'アプリの使い方でお困りのことがあれば、まずはよくある質問をご確認ください。解決しない場合は、サポートまでお気軽にお問い合わせください。多くの問題は退会せずに解決できる場合があります。'
                      : 'If you have trouble using the app, please first check the FAQ. If the issue is not resolved, feel free to contact support. Many problems can be solved without withdrawing.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}