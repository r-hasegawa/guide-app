"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import {  getUserBasicInfo, 
          UserBasicInfo,
          updateActivationStatus
        } from "@/firebase/firestore";

type AuthContextType = {
  user: User | null;
  userInfo: UserBasicInfo | null;
  loading: boolean;
  refreshUserInfo: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userInfo: null, 
  loading: true,
  refreshUserInfo: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userInfo, setUserInfo] = useState<UserBasicInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserInfo = async (firebaseUser: User) => {
    try {
      const basicInfo = await getUserBasicInfo(firebaseUser.uid);
      setUserInfo(basicInfo);
    } catch (error) {
      console.error("ユーザー情報の取得に失敗:", error);
      setUserInfo(null);
    }
  };

  const refreshUserInfo = async () => {
    if (user) {
      await fetchUserInfo(user);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserInfo(firebaseUser);
        
        // メール認証状態が変更された場合、Firestoreも更新
        if (firebaseUser.emailVerified) {
          try {
            const userDoc = await getUserBasicInfo(firebaseUser.uid);
            if (userDoc && !userDoc.activated) {
              // Firestoreのactivatedフラグを更新
              await updateActivationStatus(firebaseUser.uid, true);
              // 情報を再取得
              await fetchUserInfo(firebaseUser);
            }
          } catch (error) {
            console.error("アクティベーション状態の更新エラー:", error);
          }
        }
      } else {
        setUserInfo(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userInfo, loading, refreshUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);