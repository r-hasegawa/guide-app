"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { saveUserProfile, getUserProfile, UserProfile } from "@/firebase/firestore";

export default function ProfileEditPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    language: "",
    introduction: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    await saveUserProfile(user.uid, profile);
    router.push("/mypage/profile/view");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const existing = await getUserProfile(user.uid);
      if (existing) setProfile(existing);
    };
    fetchProfile();
  }, [user]);

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">プロフィール作成・編集</h1>

      <label className="block mb-4">
        <span className="font-semibold block mb-1">名前</span>
        <input
          type="text"
          name="name"
          value={profile.name}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          placeholder="例: 山田 太郎"
        />
      </label>

      <label className="block mb-4">
        <span className="font-semibold block mb-1">話せる言語</span>
        <input
          type="text"
          name="language"
          value={profile.language}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          placeholder="例: 日本語, 英語"
        />
      </label>

      <label className="block mb-6">
        <span className="font-semibold block mb-1">自己紹介</span>
        <textarea
          name="introduction"
          value={profile.introduction}
          onChange={handleChange}
          rows={4}
          className="w-full border px-3 py-2 rounded"
          placeholder="自己紹介を入力してください"
        />
      </label>

      <button
        onClick={handleSave}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        保存する
      </button>
    </main>
  );
}