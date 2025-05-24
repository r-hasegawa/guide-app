// Firestore関数を動的にインポート
let firestoreFunctions: any = {};

try {
  const firestoreModule = require("firebase/firestore");
  firestoreFunctions = {
    doc: firestoreModule.doc,
    getDoc: firestoreModule.getDoc,
    setDoc: firestoreModule.setDoc,
    updateDoc: firestoreModule.updateDoc,
    collection: firestoreModule.collection,
    query: firestoreModule.query,
    where: firestoreModule.where,
    orderBy: firestoreModule.orderBy,
    getDocs: firestoreModule.getDocs,
    deleteDoc: firestoreModule.deleteDoc
  };
} catch (error) {
  console.error("Firestore functions import error:", error);
}

import { db } from "./firebaseConfig";

// ユーザーの基本情報（ロール情報含む）
export interface UserBasicInfo {
  role: 'guide' | 'guest'; 
  email: string;
  createdAt: string;
  profileCompleted: boolean;
  activated: boolean; // 追加：アクティベーション状態
}

// ガイド用プロフィール
export interface GuideProfile {
  name: string;
  languages: string[];
  areas: string[];
  introduction?: string;
}

// 観光客用プロフィール
export interface GuestProfile {
  name: string;
  languages: string[];
  introduction?: string;
}

// リクエストの状態
export type RequestStatus = 'pending' | 'accepted' | 'rejected';

// マッチングリクエスト（観光客→ガイド）
export interface MatchingRequest {
  id: string;
  guestId: string;
  guideId: string;
  guestName: string;
  guideName: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// 募集投稿（観光客による）
export interface GuestPost {
  id: string;
  guestId: string;
  guestName: string;
  title: string;
  description: string;
  languages: string[]; // preferredLanguages から languages に統一
  areas: string[];
  date?: string;
  budget?: string;
  duration?: string; // 追加：希望時間
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

// ガイド応募（ガイド→観光客の募集投稿）
export interface GuideApplication {
  id: string;
  postId: string;
  guideId: string;
  guideName: string;
  guestId: string;
  guestName: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

// ========== ユーザー基本情報関連 ==========

export const saveUserBasicInfo = async (uid: string, basicInfo: UserBasicInfo) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc) return;
  await firestoreFunctions.setDoc(firestoreFunctions.doc(db, "users", uid), basicInfo, { merge: true });
};

export const getUserBasicInfo = async (uid: string): Promise<UserBasicInfo | null> => {
  if (!firestoreFunctions.getDoc || !firestoreFunctions.doc) return null;
  const docRef = firestoreFunctions.doc(db, "users", uid);
  const docSnap = await firestoreFunctions.getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserBasicInfo) : null;
};

// ========== プロフィール関連 ==========

export const saveGuideProfile = async (uid: string, profile: GuideProfile) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc || !firestoreFunctions.updateDoc) return;
  await firestoreFunctions.setDoc(firestoreFunctions.doc(db, "guide_profiles", uid), profile);
  await firestoreFunctions.updateDoc(firestoreFunctions.doc(db, "users", uid), { 
    role: "guide", 
    profileCompleted: true 
  });
};

export const getGuideProfile = async (uid: string): Promise<GuideProfile | null> => {
  if (!firestoreFunctions.getDoc || !firestoreFunctions.doc) return null;
  const docRef = firestoreFunctions.doc(db, "guide_profiles", uid);
  const docSnap = await firestoreFunctions.getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuideProfile) : null;
};

export const saveGuestProfile = async (uid: string, profile: GuestProfile) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc || !firestoreFunctions.updateDoc) return;
  await firestoreFunctions.setDoc(firestoreFunctions.doc(db, "guest_profiles", uid), profile);
  await firestoreFunctions.updateDoc(firestoreFunctions.doc(db, "users", uid), { 
    role: "guest", 
    profileCompleted: true 
  });
};

export const getGuestProfile = async (uid: string): Promise<GuestProfile | null> => {
  if (!firestoreFunctions.getDoc || !firestoreFunctions.doc) return null;
  const docRef = firestoreFunctions.doc(db, "guest_profiles", uid);
  const docSnap = await firestoreFunctions.getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuestProfile) : null;
};

export const getAllGuideProfiles = async (): Promise<(GuideProfile & { id: string })[]> => {
  if (!firestoreFunctions.getDocs || !firestoreFunctions.collection) return [];
  const querySnapshot = await firestoreFunctions.getDocs(firestoreFunctions.collection(db, "guide_profiles"));
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuideProfile & { id: string }));
};

// ========== マッチングリクエスト関連（観光客→ガイド） ==========

export const sendMatchingRequest = async (request: Omit<MatchingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc || !firestoreFunctions.collection) return;
  const now = new Date().toISOString();
  const requestData = {
    ...request,
    status: 'pending' as RequestStatus,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = firestoreFunctions.doc(firestoreFunctions.collection(db, "matching_requests"));
  await firestoreFunctions.setDoc(docRef, requestData);
  return docRef.id;
};

export const getRequestsForGuide = async (guideId: string): Promise<MatchingRequest[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.orderBy || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "matching_requests"),
    firestoreFunctions.where("guideId", "==", guideId),
    firestoreFunctions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as MatchingRequest));
};

export const getRequestsForGuest = async (guestId: string): Promise<MatchingRequest[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.orderBy || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "matching_requests"),
    firestoreFunctions.where("guestId", "==", guestId),
    firestoreFunctions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as MatchingRequest));
};

export const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
  if (!firestoreFunctions.updateDoc || !firestoreFunctions.doc) return;
  const requestRef = firestoreFunctions.doc(db, "matching_requests", requestId);
  await firestoreFunctions.updateDoc(requestRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

export const cancelMatchingRequest = async (requestId: string) => {
  if (!firestoreFunctions.deleteDoc || !firestoreFunctions.doc) return;
  const requestRef = firestoreFunctions.doc(db, "matching_requests", requestId);
  await firestoreFunctions.deleteDoc(requestRef);
};

export const getRequestedGuideIds = async (guestId: string): Promise<string[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "matching_requests"),
    firestoreFunctions.where("guestId", "==", guestId),
    firestoreFunctions.where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => doc.data().guideId);
};

// ========== 募集投稿関連（観光客による） ==========

export const createGuestPost = async (post: Omit<GuestPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc || !firestoreFunctions.collection) return;
  const now = new Date().toISOString();
  
  const postData: any = {
    guestId: post.guestId,
    guestName: post.guestName,
    title: post.title,
    description: post.description,
    languages: post.languages,
    areas: post.areas,
    status: 'active' as const,
    createdAt: now,
    updatedAt: now
  };
  
  // 任意フィールドの追加
  if (post.date && post.date.trim()) {
    postData.date = post.date;
  }
  if (post.budget && post.budget.trim()) {
    postData.budget = post.budget;
  }
  if (post.duration && post.duration.trim()) {
    postData.duration = post.duration;
  }
  
  const docRef = firestoreFunctions.doc(firestoreFunctions.collection(db, "guest_posts"));
  await firestoreFunctions.setDoc(docRef, postData);
  return docRef.id;
};

export const getAllGuestPosts = async (excludeAppliedByGuide?: string): Promise<GuestPost[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.orderBy || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "guest_posts"),
    firestoreFunctions.where("status", "==", "active"),
    firestoreFunctions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  let posts = querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuestPost));

  // ガイドが応募済みの投稿を除外
  if (excludeAppliedByGuide) {
    const appliedPostIds = await getAppliedPostIds(excludeAppliedByGuide);
    posts = posts.filter(post => !appliedPostIds.includes(post.id));
  }

  return posts;
};

export const getGuestPostsByUser = async (guestId: string): Promise<GuestPost[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.orderBy || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "guest_posts"),
    firestoreFunctions.where("guestId", "==", guestId),
    firestoreFunctions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuestPost));
};

export const getGuestPost = async (postId: string): Promise<GuestPost | null> => {
  if (!firestoreFunctions.getDoc || !firestoreFunctions.doc) return null;
  const docRef = firestoreFunctions.doc(db, "guest_posts", postId);
  const docSnap = await firestoreFunctions.getDoc(docRef);
  return docSnap.exists() ? ({ id: docRef.id, ...docSnap.data() } as GuestPost) : null;
};

export const deleteGuestPost = async (postId: string) => {
  if (!firestoreFunctions.deleteDoc || !firestoreFunctions.doc) return;
  const postRef = firestoreFunctions.doc(db, "guest_posts", postId);
  await firestoreFunctions.deleteDoc(postRef);
};

export const updateGuestPostStatus = async (postId: string, status: 'active' | 'closed') => {
  if (!firestoreFunctions.updateDoc || !firestoreFunctions.doc) return;
  const postRef = firestoreFunctions.doc(db, "guest_posts", postId);
  await firestoreFunctions.updateDoc(postRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// ========== ガイド応募関連（ガイド→観光客の募集投稿） ==========

export const sendGuideApplication = async (application: Omit<GuideApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc || !firestoreFunctions.collection) return;
  const now = new Date().toISOString();
  const applicationData = {
    ...application,
    status: 'pending' as RequestStatus,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = firestoreFunctions.doc(firestoreFunctions.collection(db, "guide_applications"));
  await firestoreFunctions.setDoc(docRef, applicationData);
  return docRef.id;
};

export const getApplicationsForGuest = async (guestId: string): Promise<GuideApplication[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.orderBy || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "guide_applications"),
    firestoreFunctions.where("guestId", "==", guestId),
    firestoreFunctions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuideApplication));
};

export const getApplicationsForGuide = async (guideId: string): Promise<GuideApplication[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.orderBy || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "guide_applications"),
    firestoreFunctions.where("guideId", "==", guideId),
    firestoreFunctions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuideApplication));
};

export const updateApplicationStatus = async (applicationId: string, status: RequestStatus) => {
  if (!firestoreFunctions.updateDoc || !firestoreFunctions.doc) return;
  const applicationRef = firestoreFunctions.doc(db, "guide_applications", applicationId);
  await firestoreFunctions.updateDoc(applicationRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

export const cancelGuideApplication = async (applicationId: string) => {
  if (!firestoreFunctions.deleteDoc || !firestoreFunctions.doc) return;
  const applicationRef = firestoreFunctions.doc(db, "guide_applications", applicationId);
  await firestoreFunctions.deleteDoc(applicationRef);
};

export const hasAlreadyApplied = async (guideId: string, postId: string): Promise<boolean> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.getDocs) return false;
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "guide_applications"),
    firestoreFunctions.where("guideId", "==", guideId),
    firestoreFunctions.where("postId", "==", postId),
    firestoreFunctions.where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return !querySnapshot.empty;
};

// ガイドが応募済みの投稿IDリストを取得
export const getAppliedPostIds = async (guideId: string): Promise<string[]> => {
  if (!firestoreFunctions.query || !firestoreFunctions.collection || !firestoreFunctions.where || !firestoreFunctions.getDocs) return [];
  const q = firestoreFunctions.query(
    firestoreFunctions.collection(db, "guide_applications"),
    firestoreFunctions.where("guideId", "==", guideId),
    firestoreFunctions.where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await firestoreFunctions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => doc.data().postId);
};

// ========== 後方互換性のための関数（非推奨） ==========

export interface UserProfile {
  language: string;
  introduction: string;
}

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
  if (!firestoreFunctions.setDoc || !firestoreFunctions.doc) return;
  await firestoreFunctions.setDoc(firestoreFunctions.doc(db, "users", uid), profile, { merge: true });
};

// アクティベーション状態を更新
export const updateActivationStatus = async (uid: string, activated: boolean) => {
  if (!firestoreFunctions.updateDoc || !firestoreFunctions.doc) return;
  await firestoreFunctions.updateDoc(firestoreFunctions.doc(db, "users", uid), {
    activated: activated
  });
};