// src/app/signup/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/firebaseConfig';

export default function SignupPage() {

  useEffect(() => {
    if (!loading && user) {
      router.replace("/profile/view");
    }
  }, [user, loading, router]);

  const searchParams = useSearchParams();
  const role = searchParams.get('role');
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      alert(`${role === 'student' ? '学生' : '観光客'}として登録しました！`);
      router.push('/profile');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800 px-4">
      <h1 className="text-2xl font-bold mb-4">
        {role === 'student' ? '学生としての登録' : '観光客としての登録'}
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
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          登録する
        </button>
      </form>
      <Link href="/" className="mt-4 text-blue-500 underline">トップページに戻る</Link>
    </main>
  );
}
