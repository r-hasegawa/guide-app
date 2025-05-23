import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, deleteDoc } from "firebase/firestore";
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
  introduction?: string;      // 自己紹介（page.tsxで必須になっているため、任意から必須に変更）
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
  // roleもここで設定/更新
  await updateDoc(doc(db, "users", uid), { 
    role: "guide", 
    profileCompleted: true 
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
  // roleもここで設定/更新
  await updateDoc(doc(db, "users", uid), { 
    role: "guest", 
    profileCompleted: true 
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

// 観光客 → ガイド に対する　リクエスト送信までのDB設計 
// src/firebase/firestore.ts に追加する型定義と関数

// リクエストの状態
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

// マッチングリクエストの型定義
export interface MatchingRequest {
  id: string;
  guestId: string;           // リクエストを送った観光客のUID
  guideId: string;           // リクエストを受け取るガイドのUID
  guestName: string;         // 観光客の名前
  guideName: string;         // ガイドの名前
  message: string;           // リクエストメッセージ
  status: RequestStatus;     // リクエストの状態
  createdAt: string;         // 作成日時
  updatedAt: string;         // 更新日時
}

// リクエストを送信
export const sendMatchingRequest = async (request: Omit<MatchingRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
  const now = new Date().toISOString();
  const requestData = {
    ...request,
    status: 'pending' as RequestStatus,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = doc(collection(db, "matching_requests"));
  await setDoc(docRef, requestData);
  return docRef.id;
};

// ガイドが受け取ったリクエスト一覧を取得
export const getRequestsForGuide = async (guideId: string): Promise<MatchingRequest[]> => {
  const q = query(
    collection(db, "matching_requests"),
    where("guideId", "==", guideId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MatchingRequest));
};

// 観光客が送ったリクエスト一覧を取得
export const getRequestsForGuest = async (guestId: string): Promise<MatchingRequest[]> => {
  const q = query(
    collection(db, "matching_requests"),
    where("guestId", "==", guestId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as MatchingRequest));
};

// リクエストのステータスを更新（承認・拒否）
export const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
  const requestRef = doc(db, "matching_requests", requestId);
  await updateDoc(requestRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// リクエストのステータスを削除（取り消し）
export const cancelMatchingRequest = async (requestId: string) => {
  const requestRef = doc(db, "matching_requests", requestId);
  await deleteDoc(requestRef);
};

// 観光客が送信したリクエストのガイドIDリストを取得
export const getRequestedGuideIds = async (guestId: string): Promise<string[]> => {
  const q = query(
    collection(db, "matching_requests"),
    where("guestId", "==", guestId),
    where("status", "in", ["pending", "accepted"])  // pending または accepted のみ
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().guideId);
};

// 全てのガイドプロフィールを取得（一覧表示用）
export const getAllGuideProfiles = async (): Promise<(GuideProfile & { id: string })[]> => {
  const querySnapshot = await getDocs(collection(db, "guide_profiles"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GuideProfile & { id: string }));
};