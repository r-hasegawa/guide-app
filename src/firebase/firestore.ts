import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, deleteDoc } from "firebase/firestore";
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
  await setDoc(doc(db, "users", uid), basicInfo, { merge: true });
};

export const getUserBasicInfo = async (uid: string): Promise<UserBasicInfo | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserBasicInfo) : null;
};

// ========== プロフィール関連 ==========

export const saveGuideProfile = async (uid: string, profile: GuideProfile) => {
  await setDoc(doc(db, "guide_profiles", uid), profile);
  await updateDoc(doc(db, "users", uid), { 
    role: "guide", 
    profileCompleted: true 
  });
};

export const getGuideProfile = async (uid: string): Promise<GuideProfile | null> => {
  const docRef = doc(db, "guide_profiles", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuideProfile) : null;
};

export const saveGuestProfile = async (uid: string, profile: GuestProfile) => {
  await setDoc(doc(db, "guest_profiles", uid), profile);
  await updateDoc(doc(db, "users", uid), { 
    role: "guest", 
    profileCompleted: true 
  });
};

export const getGuestProfile = async (uid: string): Promise<GuestProfile | null> => {
  const docRef = doc(db, "guest_profiles", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuestProfile) : null;
};

export const getAllGuideProfiles = async (): Promise<(GuideProfile & { id: string })[]> => {
  const querySnapshot = await getDocs(collection(db, "guide_profiles"));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as GuideProfile & { id: string }));
};

// ========== マッチングリクエスト関連（観光客→ガイド） ==========

export const sendMatchingRequest = async (request: Omit<MatchingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
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

export const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
  const requestRef = doc(db, "matching_requests", requestId);
  await updateDoc(requestRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

export const cancelMatchingRequest = async (requestId: string) => {
  const requestRef = doc(db, "matching_requests", requestId);
  await deleteDoc(requestRef);
};

export const getRequestedGuideIds = async (guestId: string): Promise<string[]> => {
  const q = query(
    collection(db, "matching_requests"),
    where("guestId", "==", guestId),
    where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().guideId);
};

// ========== 募集投稿関連（観光客による） ==========

export const createGuestPost = async (post: Omit<GuestPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
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
  
  const docRef = doc(collection(db, "guest_posts"));
  await setDoc(docRef, postData);
  return docRef.id;
};

export const getAllGuestPosts = async (excludeAppliedByGuide?: string): Promise<GuestPost[]> => {
  const q = query(
    collection(db, "guest_posts"),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await getDocs(q);
  let posts = querySnapshot.docs.map(doc => ({
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

export const getGuestPost = async (postId: string): Promise<GuestPost | null> => {
  const docRef = doc(db, "guest_posts", postId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docRef.id, ...docSnap.data() } as GuestPost) : null;
};

export const deleteGuestPost = async (postId: string) => {
  const postRef = doc(db, "guest_posts", postId);
  await deleteDoc(postRef);
};

export const updateGuestPostStatus = async (postId: string, status: 'active' | 'closed') => {
  const postRef = doc(db, "guest_posts", postId);
  await updateDoc(postRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// ========== ガイド応募関連（ガイド→観光客の募集投稿） ==========

export const sendGuideApplication = async (application: Omit<GuideApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
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

export const updateApplicationStatus = async (applicationId: string, status: RequestStatus) => {
  const applicationRef = doc(db, "guide_applications", applicationId);
  await updateDoc(applicationRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

export const cancelGuideApplication = async (applicationId: string) => {
  const applicationRef = doc(db, "guide_applications", applicationId);
  await deleteDoc(applicationRef);
};

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

// ガイドが応募済みの投稿IDリストを取得
export const getAppliedPostIds = async (guideId: string): Promise<string[]> => {
  const q = query(
    collection(db, "guide_applications"),
    where("guideId", "==", guideId),
    where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().postId);
};

// ========== 後方互換性のための関数（非推奨） ==========

export interface UserProfile {
  language: string;
  introduction: string;
}

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
};

// アクティベーション状態を更新
export const updateActivationStatus = async (uid: string, activated: boolean) => {
  await updateDoc(doc(db, "users", uid), {
    activated: activated
  });
};