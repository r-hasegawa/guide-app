import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// ユーザーの基本情報（ロール情報含む）
export interface UserBasicInfo {
  role: 'guide' | 'guest'; 
  email: string;
  createdAt: string;
  profileCompleted: boolean;
}

// ガイド用プロフィール
export interface GuideProfile {
  name: string;               // *必須: 名前
  languages: string[];        // *必須: 対応言語（例: ["英語", "フランス語"]）
  areas: string[];           // *必須: 対応エリア（例: ["東京", "大阪"]）
  introduction?: string;      // 自己紹介（任意）
}

// 観光客用プロフィール
export interface GuestProfile {
  name: string;               // *必須: 名前
  language: string[];         // *必須: 使用言語（例: ["英語"]）
  bio?: string;               // 自己紹介（任意）
}

export type ProfileType = 'guide' | 'guest';

export type UserProfile =
  | { type: 'guide'; profile: GuideProfile }
  | { type: 'guest'; profile: GuestProfile };

// ユーザーの基本情報を保存
export const saveUserBasicInfo = async (uid: string, basicInfo: UserBasicInfo) => {
  await setDoc(doc(db, "users", uid), basicInfo, { merge: true });
};

// ユーザーの基本情報を取得
export const getUserBasicInfo = async (uid: string): Promise<UserBasicInfo | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserBasicInfo) : null;
};

// ガイドプロフィールを保存
export const saveGuideProfile = async (uid: string, profile: GuideProfile) => {
  // プロフィールを保存
  await setDoc(doc(db, "guide_profiles", uid), profile);
  
  // プロフィール完了フラグを更新
  await setDoc(doc(db, "users", uid), { profileCompleted: true }, { merge: true });
};

// ガイドプロフィールを取得
export const getGuideProfile = async (uid: string): Promise<GuideProfile | null> => {
  const docRef = doc(db, "guide_profiles", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuideProfile) : null;
};

// 観光客プロフィールを保存
export const saveGuestProfile = async (uid: string, profile: GuestProfile) => {
  // プロフィールを保存
  await setDoc(doc(db, "guest_profiles", uid), profile);
  
  // プロフィール完了フラグを更新
  await setDoc(doc(db, "users", uid), { profileCompleted: true }, { merge: true });
};

// 観光客プロフィールを取得
export const getGuestProfile = async (uid: string): Promise<GuestProfile | null> => {
  const docRef = doc(db, "guest_profiles", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuestProfile) : null;
};

// 既存の関数（後方互換性のため）
export interface UserProfile {
  language: string;
  introduction: string;
}

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
};

export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};