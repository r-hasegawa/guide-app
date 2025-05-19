"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { getUserProfile } from "@/firebase/firestore";

export default function ProfileViewPage() {
  const { user } = useAuthContext();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const data = await getUserProfile(user.uid);
      if (data) {
        setProfile(data);
      } else {
        router.push("/profile/edit");
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  if (loading) return <div className="text-center py-10">読み込み中...</div>;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">プロフィール</h1>

      <p><strong>名前：</strong>{profile.name}</p>
      <p><strong>話せる言語：</strong>{profile.language}</p>
      <p><strong>自己紹介：</strong>{profile.introduction}</p>

      <button
        onClick={() => router.push("/profile/edit")}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        編集する
      </button>
    </main>
  );
}
