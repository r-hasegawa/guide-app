// src/app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { getGuideProfile, getGuestProfile } from "@/firebase/firestore";

export default function ProfileRouter() {
  const { user, userInfo, loading } = useAuthContext();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    // ログインしていない → /login にリダイレクト
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    // プロフィールが未完了 → オンボーディングにリダイレクト
    if (!loading && user && userInfo && !userInfo.profileCompleted) {
      router.push("/profile/onboarding");
      return;
    }

    const checkProfile = async () => {
      if (!user || !userInfo) return;

      try {
        let profile = null;
        
        if (userInfo.role === 'guide') {
          profile = await getGuideProfile(user.uid);
        } else {
          profile = await getGuestProfile(user.uid);
        }

        if (profile) {
          // プロフィールが存在 → /mypage/profile/view に遷移
          router.push("/mypage/profile/view");
        } else {
          // プロフィール未登録 → /mypage/profile/edit に遷移
          router.push("/mypage/profile/edit");
        }
      } catch (error) {
        console.error("プロフィール確認中にエラー:", error);
        // エラーの場合は編集画面に遷移
        router.push("/mypage/profile/edit");
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!loading && user && userInfo) {
      checkProfile();
    }
  }, [user, userInfo, loading, router]);

  return (loading || checkingProfile) ? (
    <div className="text-center py-10">読み込み中...</div>
  ) : null;
}