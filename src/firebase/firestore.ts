import { db } from "./firebaseConfig";

// サーバーサイドでは何もしない
const isServer = typeof window === 'undefined';

// Firestore関数を動的にロード
let firestoreFunctions: any = {};

const loadFirestoreFunctions = async () => {
  if (isServer || firestoreFunctions.doc) {
    return firestoreFunctions;
  }

  try {
    const firestoreModule = await import("firebase/firestore");
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
    console.error("Failed to load Firestore functions:", error);
  }

  return firestoreFunctions;
};

// ユーザーの基本情報（ロール情報含む）
export interface UserBasicInfo {
  role: 'guide' | 'guest'; 
  email: string;
  createdAt: string;
  profileCompleted: boolean;
  activated: boolean;
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
  languages: string[];
  areas: string[];
  date?: string;
  budget?: string;
  duration?: string;
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
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc) return;
  
  await functions.setDoc(functions.doc(db, "users", uid), basicInfo, { merge: true });
};

export const getUserBasicInfo = async (uid: string): Promise<UserBasicInfo | null> => {
  if (isServer || !db) return null;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) return null;
  
  const docRef = functions.doc(db, "users", uid);
  const docSnap = await functions.getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as UserBasicInfo) : null;
};

// ========== プロフィール関連 ==========

export const saveGuideProfile = async (uid: string, profile: GuideProfile) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.updateDoc) return;
  
  await functions.setDoc(functions.doc(db, "guide_profiles", uid), profile);
  await functions.updateDoc(functions.doc(db, "users", uid), { 
    role: "guide", 
    profileCompleted: true 
  });
};

export const getGuideProfile = async (uid: string): Promise<GuideProfile | null> => {
  if (isServer || !db) return null;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) return null;
  
  const docRef = functions.doc(db, "guide_profiles", uid);
  const docSnap = await functions.getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuideProfile) : null;
};

export const saveGuestProfile = async (uid: string, profile: GuestProfile) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.updateDoc) return;
  
  await functions.setDoc(functions.doc(db, "guest_profiles", uid), profile);
  await functions.updateDoc(functions.doc(db, "users", uid), { 
    role: "guest", 
    profileCompleted: true 
  });
};

export const getGuestProfile = async (uid: string): Promise<GuestProfile | null> => {
  if (isServer || !db) return null;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) return null;
  
  const docRef = functions.doc(db, "guest_profiles", uid);
  const docSnap = await functions.getDoc(docRef);
  return docSnap.exists() ? (docSnap.data() as GuestProfile) : null;
};

export const getAllGuideProfiles = async (): Promise<(GuideProfile & { id: string })[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDocs || !functions.collection) return [];
  
  const querySnapshot = await functions.getDocs(functions.collection(db, "guide_profiles"));
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuideProfile & { id: string }));
};

// ========== マッチングリクエスト関連（観光客→ガイド） ==========

export const sendMatchingRequest = async (request: Omit<MatchingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.collection) return;
  
  const now = new Date().toISOString();
  const requestData = {
    ...request,
    status: 'pending' as RequestStatus,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = functions.doc(functions.collection(db, "matching_requests"));
  await functions.setDoc(docRef, requestData);
  return docRef.id;
};

export const getRequestsForGuide = async (guideId: string): Promise<MatchingRequest[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "matching_requests"),
    functions.where("guideId", "==", guideId),
    functions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as MatchingRequest));
};

export const getRequestsForGuest = async (guestId: string): Promise<MatchingRequest[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "matching_requests"),
    functions.where("guestId", "==", guestId),
    functions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as MatchingRequest));
};

export const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) return;
  
  const requestRef = functions.doc(db, "matching_requests", requestId);
  await functions.updateDoc(requestRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

export const cancelMatchingRequest = async (requestId: string) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.deleteDoc || !functions.doc) return;
  
  const requestRef = functions.doc(db, "matching_requests", requestId);
  await functions.deleteDoc(requestRef);
};

export const getRequestedGuideIds = async (guestId: string): Promise<string[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "matching_requests"),
    functions.where("guestId", "==", guestId),
    functions.where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => doc.data().guideId);
};

// ========== 募集投稿関連（観光客による） ==========

export const createGuestPost = async (post: Omit<GuestPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.collection) return;
  
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
  
  const docRef = functions.doc(functions.collection(db, "guest_posts"));
  await functions.setDoc(docRef, postData);
  return docRef.id;
};

export const getAllGuestPosts = async (excludeAppliedByGuide?: string): Promise<GuestPost[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "guest_posts"),
    functions.where("status", "==", "active"),
    functions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await functions.getDocs(q);
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
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "guest_posts"),
    functions.where("guestId", "==", guestId),
    functions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuestPost));
};

export const getGuestPost = async (postId: string): Promise<GuestPost | null> => {
  if (isServer || !db) return null;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) return null;
  
  const docRef = functions.doc(db, "guest_posts", postId);
  const docSnap = await functions.getDoc(docRef);
  return docSnap.exists() ? ({ id: docRef.id, ...docSnap.data() } as GuestPost) : null;
};

export const deleteGuestPost = async (postId: string) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.deleteDoc || !functions.doc) return;
  
  const postRef = functions.doc(db, "guest_posts", postId);
  await functions.deleteDoc(postRef);
};

export const updateGuestPostStatus = async (postId: string, status: 'active' | 'closed') => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) return;
  
  const postRef = functions.doc(db, "guest_posts", postId);
  await functions.updateDoc(postRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

// ========== ガイド応募関連（ガイド→観光客の募集投稿） ==========

export const sendGuideApplication = async (application: Omit<GuideApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.collection) return;
  
  const now = new Date().toISOString();
  const applicationData = {
    ...application,
    status: 'pending' as RequestStatus,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = functions.doc(functions.collection(db, "guide_applications"));
  await functions.setDoc(docRef, applicationData);
  return docRef.id;
};

export const getApplicationsForGuest = async (guestId: string): Promise<GuideApplication[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "guide_applications"),
    functions.where("guestId", "==", guestId),
    functions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuideApplication));
};

export const getApplicationsForGuide = async (guideId: string): Promise<GuideApplication[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "guide_applications"),
    functions.where("guideId", "==", guideId),
    functions.orderBy("createdAt", "desc")
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  } as GuideApplication));
};

export const updateApplicationStatus = async (applicationId: string, status: RequestStatus) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) return;
  
  const applicationRef = functions.doc(db, "guide_applications", applicationId);
  await functions.updateDoc(applicationRef, {
    status,
    updatedAt: new Date().toISOString()
  });
};

export const cancelGuideApplication = async (applicationId: string) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.deleteDoc || !functions.doc) return;
  
  const applicationRef = functions.doc(db, "guide_applications", applicationId);
  await functions.deleteDoc(applicationRef);
};

export const hasAlreadyApplied = async (guideId: string, postId: string): Promise<boolean> => {
  if (isServer || !db) return false;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.getDocs) return false;
  
  const q = functions.query(
    functions.collection(db, "guide_applications"),
    functions.where("guideId", "==", guideId),
    functions.where("postId", "==", postId),
    functions.where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await functions.getDocs(q);
  return !querySnapshot.empty;
};

// ガイドが応募済みの投稿IDリストを取得
export const getAppliedPostIds = async (guideId: string): Promise<string[]> => {
  if (isServer || !db) return [];
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.getDocs) return [];
  
  const q = functions.query(
    functions.collection(db, "guide_applications"),
    functions.where("guideId", "==", guideId),
    functions.where("status", "in", ["pending", "accepted"])
  );
  
  const querySnapshot = await functions.getDocs(q);
  return querySnapshot.docs.map((doc: any) => doc.data().postId);
};

// ========== 後方互換性のための関数（非推奨） ==========

export interface UserProfile {
  language: string;
  introduction: string;
}

export const saveUserProfile = async (uid: string, profile: UserProfile) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc) return;
  
  await functions.setDoc(functions.doc(db, "users", uid), profile, { merge: true });
};

// アクティベーション状態を更新
export const updateActivationStatus = async (uid: string, activated: boolean) => {
  if (isServer || !db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) return;
  
  await functions.updateDoc(functions.doc(db, "users", uid), {
    activated: activated
  });
};