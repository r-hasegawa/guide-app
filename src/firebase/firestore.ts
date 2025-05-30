// src/firebase/firestore.ts
import { getFirestore } from "./firebaseConfig";

// サーバーサイドでは何もしない
const isServer = typeof window === 'undefined';

// Firestore関数を動的にロード
let firestoreFunctions: any = {};

const loadFirestoreFunctions = async () => {
  if (isServer || firestoreFunctions.doc) {
    return firestoreFunctions;
  }

  try {
    // @ts-ignore - 型エラーを完全に回避
    const firestoreModule: any = await import("firebase/firestore");
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
      deleteDoc: firestoreModule.deleteDoc,
      addDoc: firestoreModule.addDoc,
      serverTimestamp: firestoreModule.serverTimestamp
    };
  } catch (error) {
    console.error("Failed to load Firestore functions:", error);
  }

  return firestoreFunctions;
};

// ========== 型定義 ==========

// ユーザーの基本情報（ロール情報含む）
export interface UserBasicInfo {
  role: 'guide' | 'guest' | 'admin';
  email: string;
  createdAt: string;
  profileCompleted: boolean;
  activated: boolean;
  language: 'ja' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
  };
}

// シンプルなお知らせの型定義
export interface Announcement {
  id: string;
  titleJa: string;      // 日本語タイトル
  titleEn: string;      // 英語タイトル
  contentJa: string;    // 日本語本文
  contentEn: string;    // 英語本文
  createdAt: any;       // 公開日（自動）
}

// 新規お知らせ作成用の型
export interface CreateAnnouncementData {
  titleJa: string;
  titleEn: string;
  contentJa: string;
  contentEn: string;
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
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    await functions.setDoc(functions.doc(db, "users", uid), basicInfo, { merge: true });
  } catch (error) {
    console.error("Error saving user basic info:", error);
    throw error;
  }
};

export const getUserBasicInfo = async (uid: string): Promise<UserBasicInfo | null> => {
  if (isServer) return null;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return null;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return null;
  }
  
  try {
    const docRef = functions.doc(db, "users", uid);
    const docSnap = await functions.getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as UserBasicInfo) : null;
  } catch (error) {
    console.error("Error getting user basic info:", error);
    return null;
  }
};

export const updateUserSettings = async (uid: string, settings: { language: 'ja' | 'en'; notifications: { email: boolean; push: boolean } }) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    await functions.updateDoc(functions.doc(db, "users", uid), {
      language: settings.language,
      notifications: settings.notifications
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    throw error;
  }
};

export const updateActivationStatus = async (uid: string, activated: boolean) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    await functions.updateDoc(functions.doc(db, "users", uid), {
      activated: activated
    });
  } catch (error) {
    console.error("Error updating activation status:", error);
    throw error;
  }
};

// ========== お知らせ関連 ==========

export const createAnnouncement = async (data: CreateAnnouncementData) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.addDoc || !functions.collection || !functions.serverTimestamp) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    const docRef = await functions.addDoc(functions.collection(db, 'announcements'), {
      titleJa: data.titleJa,
      titleEn: data.titleEn,
      contentJa: data.contentJa,
      contentEn: data.contentEn,
      createdAt: functions.serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating announcement:", error);
    throw error;
  }
};

export const getAnnouncements = async (): Promise<Announcement[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.collection || !functions.query || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
    const q = functions.query(
      functions.collection(db, 'announcements'),
      functions.orderBy('createdAt', 'desc')
    );
    
    const snapshot = await functions.getDocs(q);
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Announcement[];
  } catch (error) {
    console.error("Error getting announcements:", error);
    return [];
  }
};

export const deleteAnnouncement = async (announcementId: string) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.doc || !functions.deleteDoc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    await functions.deleteDoc(functions.doc(db, 'announcements', announcementId));
  } catch (error) {
    console.error("Error deleting announcement:", error);
    throw error;
  }
};

// ========== プロフィール関連 ==========

export const saveGuideProfile = async (uid: string, profile: GuideProfile) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.updateDoc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    await functions.setDoc(functions.doc(db, "guide_profiles", uid), profile);
    await functions.updateDoc(functions.doc(db, "users", uid), { 
      role: "guide", 
      profileCompleted: true 
    });
  } catch (error) {
    console.error("Error saving guide profile:", error);
    throw error;
  }
};

export const getGuideProfile = async (uid: string): Promise<GuideProfile | null> => {
  if (isServer) return null;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return null;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return null;
  }
  
  try {
    const docRef = functions.doc(db, "guide_profiles", uid);
    const docSnap = await functions.getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as GuideProfile) : null;
  } catch (error) {
    console.error("Error getting guide profile:", error);
    return null;
  }
};

export const saveGuestProfile = async (uid: string, profile: GuestProfile) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.updateDoc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    await functions.setDoc(functions.doc(db, "guest_profiles", uid), profile);
    await functions.updateDoc(functions.doc(db, "users", uid), { 
      role: "guest", 
      profileCompleted: true 
    });
  } catch (error) {
    console.error("Error saving guest profile:", error);
    throw error;
  }
};

export const getGuestProfile = async (uid: string): Promise<GuestProfile | null> => {
  if (isServer) return null;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return null;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return null;
  }
  
  try {
    const docRef = functions.doc(db, "guest_profiles", uid);
    const docSnap = await functions.getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as GuestProfile) : null;
  } catch (error) {
    console.error("Error getting guest profile:", error);
    return null;
  }
};

export const getAllGuideProfiles = async (): Promise<(GuideProfile & { id: string })[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDocs || !functions.collection) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
    const querySnapshot = await functions.getDocs(functions.collection(db, "guide_profiles"));
    return querySnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    } as GuideProfile & { id: string }));
  } catch (error) {
    console.error("Error getting all guide profiles:", error);
    return [];
  }
};

// ========== マッチングリクエスト関連（観光客→ガイド） ==========

export const sendMatchingRequest = async (request: Omit<MatchingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.collection) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
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
  } catch (error) {
    console.error("Error sending matching request:", error);
    throw error;
  }
};

export const getRequestsForGuide = async (guideId: string): Promise<MatchingRequest[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
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
  } catch (error) {
    console.error("Error getting requests for guide:", error);
    return [];
  }
};

export const getRequestsForGuest = async (guestId: string): Promise<MatchingRequest[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
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
  } catch (error) {
    console.error("Error getting requests for guest:", error);
    return [];
  }
};

export const updateRequestStatus = async (requestId: string, status: RequestStatus) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    const requestRef = functions.doc(db, "matching_requests", requestId);
    await functions.updateDoc(requestRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    throw error;
  }
};

export const cancelMatchingRequest = async (requestId: string) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.deleteDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    const requestRef = functions.doc(db, "matching_requests", requestId);
    await functions.deleteDoc(requestRef);
  } catch (error) {
    console.error("Error canceling matching request:", error);
    throw error;
  }
};

export const getRequestedGuideIds = async (guestId: string): Promise<string[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
    const q = functions.query(
      functions.collection(db, "matching_requests"),
      functions.where("guestId", "==", guestId),
      functions.where("status", "in", ["pending", "accepted"])
    );
    
    const querySnapshot = await functions.getDocs(q);
    return querySnapshot.docs.map((doc: any) => doc.data().guideId);
  } catch (error) {
    console.error("Error getting requested guide IDs:", error);
    return [];
  }
};

// ========== 募集投稿関連（観光客による） ==========

export const createGuestPost = async (post: Omit<GuestPost, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.collection) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
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
  } catch (error) {
    console.error("Error creating guest post:", error);
    throw error;
  }
};

export const getAllGuestPosts = async (excludeAppliedByGuide?: string): Promise<GuestPost[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
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
  } catch (error) {
    console.error("Error getting all guest posts:", error);
    return [];
  }
};

export const getGuestPostsByUser = async (guestId: string): Promise<GuestPost[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
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
  } catch (error) {
    console.error("Error getting guest posts by user:", error);
    return [];
  }
};

export const getGuestPost = async (postId: string): Promise<GuestPost | null> => {
  if (isServer) return null;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return null;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return null;
  }
  
  try {
    const docRef = functions.doc(db, "guest_posts", postId);
    const docSnap = await functions.getDoc(docRef);
    return docSnap.exists() ? ({ id: docRef.id, ...docSnap.data() } as GuestPost) : null;
  } catch (error) {
    console.error("Error getting guest post:", error);
    return null;
  }
};

export const deleteGuestPost = async (postId: string) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.deleteDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    const postRef = functions.doc(db, "guest_posts", postId);
    await functions.deleteDoc(postRef);
  } catch (error) {
    console.error("Error deleting guest post:", error);
    throw error;
  }
};

// ========== ガイド応募関連（ガイド→観光客の募集投稿） ==========

export const sendGuideApplication = async (application: Omit<GuideApplication, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.setDoc || !functions.doc || !functions.collection) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
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
  } catch (error) {
    console.error("Error sending guide application:", error);
    throw error;
  }
};

export const getApplicationsForGuest = async (guestId: string): Promise<GuideApplication[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
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
  } catch (error) {
    console.error("Error getting applications for guest:", error);
    return [];
  }
};

export const getApplicationsForGuide = async (guideId: string): Promise<GuideApplication[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.orderBy || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
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
  } catch (error) {
    console.error("Error getting applications for guide:", error);
    return [];
  }
};

export const updateApplicationStatus = async (applicationId: string, status: RequestStatus) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    const applicationRef = functions.doc(db, "guide_applications", applicationId);
    await functions.updateDoc(applicationRef, {
      status,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    throw error;
  }
};

export const cancelGuideApplication = async (applicationId: string) => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return;
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.deleteDoc || !functions.doc) {
    console.error("Firestore functions not loaded");
    return;
  }
  
  try {
    const applicationRef = functions.doc(db, "guide_applications", applicationId);
    await functions.deleteDoc(applicationRef);
  } catch (error) {
    console.error("Error canceling guide application:", error);
    throw error;
  }
};

export const getAppliedPostIds = async (guideId: string): Promise<string[]> => {
  if (isServer) return [];
  
  const db = await getFirestore();
  if (!db) {
    console.error("Firestore not initialized");
    return [];
  }
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.where || !functions.getDocs) {
    console.error("Firestore functions not loaded");
    return [];
  }
  
  try {
    const q = functions.query(
      functions.collection(db, "guide_applications"),
      functions.where("guideId", "==", guideId),
      functions.where("status", "in", ["pending", "accepted"])
    );
    
    const querySnapshot = await functions.getDocs(q);
    return querySnapshot.docs.map((doc: any) => doc.data().postId);
  } catch (error) {
    console.error("Error getting applied post IDs:", error);
    return [];
  }
};