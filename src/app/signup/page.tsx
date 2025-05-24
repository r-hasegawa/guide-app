// src/app/signup/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  getAdditionalUserInfo,
  sendEmailVerification
} from 'firebase/auth';
import { auth, db } from '@/firebase/firebaseConfig';
import { useAuthContext } from '@/contexts/AuthContext';
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function SignupPage() {
  const { user, loading } = useAuthContext();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'guide' | 'guest' | null;
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/profile/onboarding");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // ロールが指定されていない場合はトップページにリダイレクト
    if (!role || (role !== 'guide' && role !== 'guest')) {
      router.replace('/');
    }
  }, [role, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const saveUserBasicInfo = async (firebaseUser: any, isNewUser: boolean = true) => {
    console.log('saveUserBasicInfo called', { uid: firebaseUser.uid, email: firebaseUser.email, role, isNewUser });
    
    try {
      // 既存ユーザーの場合、既にプロフィールが存在するかチェック
      if (!isNewUser) {
        const existingUserDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (existingUserDoc.exists()) {
          const existingData = existingUserDoc.data();
          console.log('既存ユーザーデータ:', existingData);
          
          // 既にプロフィールが完了している場合は適切なページにリダイレクト
          if (existingData.profileCompleted) {
            if (existingData.role === 'guide') {
              router.replace('/guides');
            } else {
              router.replace('/posts');
            }
            return;
          }
          // プロフィール未完了の場合はオンボーディングに進む
          router.push('/profile/onboarding');
          return;
        }
      }

      // 新規ユーザーまたは既存ユーザーでもFirestoreにデータがない場合
      const userProfile = {
        email: firebaseUser.email || '',
        createdAt: new Date().toISOString(),
        role: role,
        profileCompleted: false,
        activated: firebaseUser.emailVerified || false, // メール認証状態を確認
      };
      
      console.log('Firestoreに保存するデータ:', userProfile);
      console.log('Selected role from URL:', role);
      await setDoc(doc(db, "users", firebaseUser.uid), userProfile);
      console.log('Firestoreへの保存完了');
      
      // メール認証が必要な場合
      if (!firebaseUser.emailVerified) {
        router.push('/activation/pending');
      } else {
        // AuthContextの更新を待ってからリダイレクト
        setTimeout(() => {
          router.push('/profile/onboarding');
        }, 1500);
      }
    } catch (error) {
      console.error('saveUserBasicInfo エラー:', error);
      throw error;
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    
    setError(null);
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('Email signup success:', userCredential.user.uid);
      
      // メール認証送信
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/activation/complete`, // 認証完了後のリダイレクト先
        handleCodeInApp: true
      });
      
      await saveUserBasicInfo(userCredential.user, true);
    } catch (err: any) {
      console.error('登録エラー:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('このメールアドレスは既に使用されています。');
      } else if (err.code === 'auth/weak-password') {
        setError('パスワードは6文字以上で入力してください。');
      } else {
        setError('登録に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!role) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      // 既存アカウントとの関連付けを促すため
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      
      // より正確な新規ユーザー判定
      const additionalUserInfo = getAdditionalUserInfo(result);
      const isNewUser = additionalUserInfo?.isNewUser ?? false;
      
      console.log('Google signup success:', { 
        uid: result.user.uid, 
        email: result.user.email,
        isNewUser: isNewUser,
        emailVerified: result.user.emailVerified
      });
      
      await saveUserBasicInfo(result.user, isNewUser);
    } catch (err: any) {
      console.error('Google登録エラー:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Googleログインがキャンセルされました。');
      } else if (err.code === 'auth/popup-blocked') {
        setError('ポップアップがブロックされました。ポップアップを許可してください。');
      } else {
        setError('Google登録に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">読み込み中...</div>;

  if (!role) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {role === 'guide' ? 'ガイドとしての登録' : '観光客としての登録'}
        </h1>
        
        {/* ソーシャル登録ボタン */}
        <div className="mb-6">
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleで登録
          </button>
        </div>

        {/* 区切り線 */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">または</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* メール登録フォーム */}
        <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="メールアドレス"
            value={formData.email}
            onChange={handleChange}
            className="border rounded px-4 py-2"
            disabled={isLoading}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="パスワード（6文字以上）"
            value={formData.password}
            onChange={handleChange}
            className="border rounded px-4 py-2"
            disabled={isLoading}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "登録中..." : "メールで登録する"}
          </button>
        </form>
        
        <Link href="/" className="mt-4 block text-center text-blue-500 underline">
          トップページに戻る
        </Link>
      </div>
    </main>
  );
}