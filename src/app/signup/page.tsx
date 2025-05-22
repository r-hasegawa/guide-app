'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';
import { useAuthContext } from '@/contexts/AuthContext';
import { saveUserBasicInfo, UserBasicInfo } from '@/firebase/firestore';

export default function SignupPage() {
  const { user, loading } = useAuthContext();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'guide' | 'guest';
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/mypage");
    }
  }, [user, loading, router]);

  // ロールが不正な場合はトップページにリダイレクト
  useEffect(() => {
    if (!role || (role !== 'guide' && role !== 'guest')) {
      router.replace('/');
    }
  }, [role, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Firebase Authでユーザー作成
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      // ユーザーの基本情報をFirestoreに保存
      const basicInfo: UserBasicInfo = {
        role: role,
        email: formData.email,
        createdAt: new Date().toISOString(),
        profileCompleted: false
      };

      await saveUserBasicInfo(userCredential.user.uid, basicInfo);

      alert(`${role === 'guide' ? 'ガイド' : '観光客'}として登録しました！`);
      
      // プロフィール作成画面にリダイレクト
      router.push('/profile/onboarding');
    } catch (err: any) {
      console.error('登録エラー:', err);
      setError('登録に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!role || (role !== 'guide' && role !== 'guest')) {
    return <div>読み込み中...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <h1 className="text-2xl font-bold mb-4">
        {role === 'guide' ? 'ガイドとしての登録' : '観光客としての登録'}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          name="name"
          placeholder="名前"
          value={formData.name}
          onChange={handleChange}
          className="border rounded px-4 py-2"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="メールアドレス"
          value={formData.email}
          onChange={handleChange}
          className="border rounded px-4 py-2"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="パスワード（6文字以上）"
          value={formData.password}
          onChange={handleChange}
          className="border rounded px-4 py-2"
          minLength={6}
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isSubmitting ? '登録中...' : '登録する'}
        </button>
      </form>
      <Link href="/" className="mt-4 text-blue-500 underline">トップページに戻る</Link>
    </main>
  );
}