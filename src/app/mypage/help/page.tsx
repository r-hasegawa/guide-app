// src/app/mypage/help/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';

export default function HelpPage() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>([]);

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
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
    alert('退会機能は現在準備中です。サポートまでお問い合わせください。');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="mr-4 text-blue-500 hover:text-blue-700"
        >
          ← 戻る
        </button>
        <h1 className="text-2xl font-bold">❓ ヘルプ</h1>
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
              <h2 className="text-lg font-semibold">アプリの使い方</h2>
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
                    <h3 className="text-lg font-semibold mb-3">🎓 ガイドとしての使い方</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">1. プロフィール設定</h4>
                        <p className="text-gray-700 ml-4">
                          マイページ → プロフィール編集から、対応言語、エリア、自己紹介を設定してください。
                          詳細なプロフィールがあると、観光客からのリクエストが増えやすくなります。
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">2. ガイド募集への応募</h4>
                        <p className="text-gray-700 ml-4">
                          「ガイド募集」ページで観光客が投稿した募集を確認し、興味のある案件に応募できます。
                          応募時には自己紹介や対応可能な内容を詳しく記載しましょう。
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">3. リクエストの管理</h4>
                        <p className="text-gray-700 ml-4">
                          「申請管理」ページで観光客からの直接リクエストを確認・承認できます。
                          リクエストには迅速に対応することを心がけましょう。
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">4. チャットでのやり取り</h4>
                        <p className="text-gray-700 ml-4">
                          マッチングが成立した相手とは「チャット」機能でやり取りができます。
                          待ち合わせ場所や時間の調整を行いましょう。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">✈️ 観光客としての使い方</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">1. プロフィール設定</h4>
                        <p className="text-gray-700 ml-4">
                          マイページ → プロフィール編集から、話せる言語、自己紹介を設定してください。
                          ガイドがあなたのことを理解しやすくなります。
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">2. ガイドの検索</h4>
                        <p className="text-gray-700 ml-4">
                          「ガイド検索」ページで条件に合うガイドを探し、直接リクエストを送ることができます。
                          希望する日時や内容を詳しく伝えましょう。
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">3. 募集投稿の作成</h4>
                        <p className="text-gray-700 ml-4">
                          「ガイド募集」ページで新しい募集を作成し、複数のガイドから応募を受け取ることができます。
                          具体的な希望を記載すると良い応募が集まりやすくなります。
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">4. 応募の管理</h4>
                        <p className="text-gray-700 ml-4">
                          「申請管理」ページでガイドからの応募を確認・承認できます。
                          プロフィールを確認して最適なガイドを選びましょう。
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
              <h2 className="text-lg font-semibold">よくある質問</h2>
            </div>
            <span className={`transform transition-transform ${isOpen('faq') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isOpen('faq') && (
            <div className="px-6 pb-6 border-t bg-gray-50">
              <div className="space-y-6 pt-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Q. メール認証が完了しません</h3>
                  <p className="text-gray-700 ml-4">
                    A. 迷惑メールフォルダをご確認ください。メールが届かない場合は、認証メールの再送信をお試しください。
                    それでも解決しない場合は、正しいメールアドレスが登録されているか確認してください。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Q. プロフィール情報を変更したい</h3>
                  <p className="text-gray-700 ml-4">
                    A. マイページ → プロフィール → 編集から情報を変更できます。
                    変更した内容は保存ボタンを押すと即座に反映されます。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Q. マッチングが成立した後のキャンセルはできますか？</h3>
                  <p className="text-gray-700 ml-4">
                    A. 緊急事態や体調不良など、やむを得ない理由でのキャンセルは可能ですが、
                    相手にできるだけ早く連絡を取り、誠意を持って対応してください。
                    頻繁なキャンセルはアカウント制限の対象となる場合があります。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Q. 料金の支払い方法は？</h3>
                  <p className="text-gray-700 ml-4">
                    A. 現在は当事者間での直接のやり取りとなります。
                    事前にガイド料金や支払い方法について相談し、合意の上で進めてください。
                    将来的にはアプリ内決済機能の実装を予定しています。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Q. 不適切なユーザーを報告したい</h3>
                  <p className="text-gray-700 ml-4">
                    A. 不適切な行為や迷惑行為を受けた場合は、速やかにサポートまでご連絡ください。
                    チャットのスクリーンショットなど、証拠となる情報があると調査がスムーズに進みます。
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Q. パスワードを忘れてしまいました</h3>
                  <p className="text-gray-700 ml-4">
                    A. ログイン画面の「パスワードを忘れた方」のリンクから、パスワードリセット用のメールを送信できます。
                    メールに記載されたリンクから新しいパスワードを設定してください。
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
              <h2 className="text-lg font-semibold text-red-600">退会について</h2>
            </div>
            <span className={`transform transition-transform ${isOpen('withdraw') ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
          
          {isOpen('withdraw') && (
            <div className="px-6 pb-6 border-t bg-red-50">
              <div className="space-y-6 pt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">退会前の注意事項</h3>
                  <ul className="text-yellow-700 space-y-1 ml-4">
                    <li>• 退会すると全てのデータが削除され、復元できません</li>
                    <li>• 進行中のマッチングがある場合は、事前に相手に連絡してください</li>
                    <li>• 退会後は同じメールアドレスでの再登録ができません</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">退会手続きについて</h3>
                  <p className="text-gray-700 mb-4">
                    退会をご希望の場合は、以下のボタンから手続きを開始してください。
                    退会理由をお聞かせいただけると、サービス改善に役立てさせていただきます。
                  </p>
                  
                  <button
                    onClick={handleWithdraw}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
                  >
                    退会手続きを開始
                  </button>
                </div>
                
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">お困りのことがあれば</h3>
                  <p className="text-gray-700">
                    アプリの使い方でお困りのことがあれば、まずはよくある質問をご確認ください。
                    解決しない場合は、サポートまでお気軽にお問い合わせください。
                    多くの問題は退会せずに解決できる場合があります。
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