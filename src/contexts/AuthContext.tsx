"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/firebaseConfig";
import { getUserBasicInfo, UserBasicInfo } from "@/firebase/firestore";

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