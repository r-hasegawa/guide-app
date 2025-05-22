import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// ユーザーの基本情報（ロール情報含む）
export interface UserBasicInfo {
  role: 'guide' | 'guest'; 
  email: string;
  createdAt: string; // Date型で保存されることが多いですが、ここではstringのままとします
  profileCompleted: boolean;
}

// ガイド用プロフィール
export interface GuideProfile {
  name: string;               // *必須: 名前
  languages: string[];        // *必須: 対応言語（例: ["英語", "フランス語"]）
  areas: string[];           // *必須: 対応エリア（例: ["東京", "大阪"]）
  introduction: string;      // 自己紹介（page.tsxで必須になっているため、任意から必須に変更）
}

// 観光客用プロフィール
export interface GuestProfile {
  name: string;               // *必須: 名前
  languages: string[];        // *必須: 使用言語（例: ["英語"]） - 'language' から 'languages' に修正
  introduction?: string;      // 自己紹介（任意） - 'bio' から 'introduction' に修正
}

export type ProfileType = 'guide' | 'guest';

// UserProfileは、guideProfileまたはguestProfileのどちらかを持つ型として定義します
// この型は現在直接使用されていませんが、将来的に有用です。
export type UserProfileData =
  | { type: 'guide'; profile: GuideProfile }
  | { type: 'guest'; profile: GuestProfile };

// ユーザーの基本情報を保存（初回登録時などに使用）
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
  // guide_profiles コレクションにガイドプロフィールを保存
  await setDoc(doc(db, "guide_profiles", uid), profile);
  
  // users コレクションにロールとプロフィール完了フラグを更新
  await updateDoc(doc(db, "users", uid), { 
    role: "guide", // ロールを明示的に設定
    profileCompleted: true // プロフィール完了
  });
};

// ガイドプロフィールを取得
export const getGuideProfile = async (uid: string): Promise<GuideProfile | null> => {
  const docRef = doc(db, "guide_profiles", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuideProfile) : null;
};

// 観光客プロフィールを保存
export const saveGuestProfile = async (uid: string, profile: GuestProfile) => {
  // guest_profiles コレクションに観光客プロフィールを保存
  await setDoc(doc(db, "guest_profiles", uid), profile);
  
  // users コレクションにロールとプロフィール完了フラグを更新
  await updateDoc(doc(db, "users", uid), { 
    role: "guest", // ロールを明示的に設定
    profileCompleted: true // プロフィール完了
  });
};

// 観光客プロフィールを取得
export const getGuestProfile = async (uid: string): Promise<GuestProfile | null> => {
  const docRef = doc(db, "guest_profiles", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuestProfile) : null;
};

// 既存の関数（後方互換性のため残されていますが、新しい関数と重複する可能性があります）
// 注意：このUserProfileインターフェースは、GuideProfileやGuestProfileとは異なる構造です。
// 通常は上記の新しい型定義に統一することを推奨します。
export interface UserProfile {
  language: string; // 単一の言語として定義されている
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