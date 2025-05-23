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

// ガイド → 募集(観光客からのリクルート) に対する　リクエスト送信までのDB設計 
// src/firebase/firestore.ts に追加する型定義と関数

// 募集投稿の型定義
export interface GuestPost {
  id: string;
  guestId: string;           // 投稿者（観光客）のUID
  guestName: string;         // 投稿者の名前
  title: string;             // 募集タイトル
  description: string;       // 募集詳細
  preferredLanguages: string[]; // 希望する言語
  areas: string[];           // 希望するエリア
  date?: string;             // 希望日時（任意）
  budget?: string;           // 予算（任意）
  status: 'active' | 'closed'; // 募集状態
  createdAt: string;         // 作成日時
  updatedAt: string;         // 更新日時
}

// ガイドから観光客の募集投稿に対する応募
export interface GuideApplication {
  id: string;
  postId: string;            // 募集投稿のID
  guideId: string;           // 応募したガイドのUID
  guideName: string;         // ガイドの名前
  guestId: string;           // 募集投稿者（観光客）のUID
  guestName: string;         // 募集投稿者の名前
  postTitle: string;         // 募集投稿のタイトル
  message: string;           // 応募メッセージ
  status: RequestStatus;     // 応募の状態（既存のRequestStatusを流用）
  createdAt: string;         // 作成日時
  updatedAt: string;         // 更新日時
}

// src/firebase/firestore.ts の createGuestPost 関数を修正

// 募集投稿を作成
export const createGuestPost = async (post: Omit<GuestPost, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  const now = new Date().toISOString();
  
  // undefined値を除去してからFirestoreに送信
  const postData: any = {
    guestId: post.guestId,
    guestName: post.guestName,
    title: post.title,
    description: post.description,
    preferredLanguages: post.preferredLanguages,
    areas: post.areas,
    status: 'active' as const,
    createdAt: now,
    updatedAt: now
  };
  
  // 任意フィールドはundefinedでない場合のみ追加
  if (post.date !== undefined && post.date !== '') {
    postData.date = post.date;
  }
  
  if (post.budget !== undefined && post.budget !== '') {
    postData.budget = post.budget;
  }
  
  const docRef = doc(collection(db, "guest_posts"));
  console.log("Sending postData:", postData);
  await setDoc(docRef, postData);
  return docRef.id;
};


// 全ての募集投稿を取得（ガイド用一覧表示）
export const getAllGuestPosts = async (): Promise<GuestPost[]> => {
  const q = query(
    collection(db, "guest_posts"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GuestPost));
};

// 特定の観光客の募集投稿を取得
export const getGuestPostsByUser = async (guestId: string): Promise<GuestPost[]> => {
  const q = query(
    collection(db, "guest_posts"),
    where("guestId", "==", guestId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GuestPost));
};

// 募集投稿を削除
export const deleteGuestPost = async (postId: string) => {
  const postRef = doc(db, "guest_posts", postId);
  await deleteDoc(postRef);
};

// 募集投稿のステータスを更新
export const updateGuestPostStatus = async (postId: string, status: 'active' | 'closed') => {
  const postRef = doc(db, "guest_posts", postId);
  await updateDoc(postRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// ガイドが募集投稿に応募
export const applyToGuestPost = async (application: Omit<GuideApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
  const now = new Date().toISOString();
  const applicationData = {
    ...application,
    status: 'pending' as RequestStatus,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = doc(collection(db, "guide_applications"));
  await setDoc(docRef, applicationData);
  return docRef.id;
};

// 観光客が受け取った応募一覧を取得
export const getApplicationsForGuest = async (guestId: string): Promise<GuideApplication[]> => {
  const q = query(
    collection(db, "guide_applications"),
    where("guestId", "==", guestId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GuideApplication));
};

// ガイドが送った応募一覧を取得
export const getApplicationsForGuide = async (guideId: string): Promise<GuideApplication[]> => {
  const q = query(
    collection(db, "guide_applications"),
    where("guideId", "==", guideId),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GuideApplication));
};

// 応募のステータスを更新
export const updateApplicationStatus = async (applicationId: string, status: RequestStatus) => {
  const applicationRef = doc(db, "guide_applications", applicationId);
  await updateDoc(applicationRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// 応募を取り消し
export const cancelApplication = async (applicationId: string) => {
  const applicationRef = doc(db, "guide_applications", applicationId);
  await deleteDoc(applicationRef);
};

// 特定の投稿詳細を取得
export const getGuestPostById = async (postId: string): Promise<GuestPost | null> => {
  const docRef = doc(db, "guest_posts", postId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docRef.id, ...docSnap.data() } as GuestPost) : null;
};

// ガイドが既に応募済みかチェック
export const hasAlreadyApplied = async (guideId: string, postId: string): Promise<boolean> => {
  const q = query(
    collection(db, "guide_applications"),
    where("guideId", "==", guideId),
    where("postId", "==", postId),
    where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};