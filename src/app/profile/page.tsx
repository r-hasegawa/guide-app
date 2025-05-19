// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { getUserProfile } from "@/firebase/firestore";

export default function ProfileRouter() {
  const { user } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ログインしていない → /login にリダイレクト
    if (!user) {
      router.push("/login");
      return;
    }

    const checkProfile = async () => {
      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          // プロフィールが存在 → /profile/view に遷移
          router.push("/profile/view");
        } else {
          // プロフィール未登録 → /profile/edit に遷移
          router.push("/profile/edit");
        }
      } catch (error) {
        console.error("プロフィール確認中にエラー:", error);
        // 必要ならエラーページに遷移など
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, [user]);

  return loading ? (
    <div className="text-center py-10">読み込み中...</div>
  ) : null;
}
