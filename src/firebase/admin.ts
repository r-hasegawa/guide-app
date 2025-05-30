// src/firebase/admin.ts
import { getFirestore } from "./firebaseConfig";
import { Announcement, CreateAnnouncementData, UserStats, AnnouncementStats } from '@/types/admin';

// サーバーサイドでは何もしない
const isServer = typeof window === 'undefined';

// Firestore関数を動的にロード
let firestoreFunctions: any = {};

const loadFirestoreFunctions = async () => {
  if (isServer || firestoreFunctions.doc) {
    return firestoreFunctions;
  }

  try {
    const firestoreModule: any = await import("firebase/firestore");
    firestoreFunctions = {
      doc: firestoreModule.doc,
      getDoc: firestoreModule.getDoc,
      setDoc: firestoreModule.setDoc,
      updateDoc: firestoreModule.updateDoc,
      deleteDoc: firestoreModule.deleteDoc,
      collection: firestoreModule.collection,
      query: firestoreModule.query,
      where: firestoreModule.where,
      orderBy: firestoreModule.orderBy,
      limit: firestoreModule.limit,
      getDocs: firestoreModule.getDocs,
      addDoc: firestoreModule.addDoc,
      serverTimestamp: firestoreModule.serverTimestamp,
      increment: firestoreModule.increment,
      arrayUnion: firestoreModule.arrayUnion,
      startAfter: firestoreModule.startAfter
    };
  } catch (error) {
    console.error("Failed to load Firestore functions:", error);
  }

  return firestoreFunctions;
};

// ========== お知らせ管理関数 ==========

export const createAnnouncement = async (
  data: CreateAnnouncementData,
  adminId: string,
  adminEmail: string
): Promise<string> => {
  if (isServer) throw new Error('Cannot run on server');
  
  const db = await getFirestore();
  if (!db) throw new Error('Firestore not initialized');
  
  const functions = await loadFirestoreFunctions();
  if (!functions.addDoc) throw new Error('Firestore functions not loaded');
  
  try {
    const announcementData = {
      ...data,
      isActive: true,
      createdAt: functions.serverTimestamp(),
      createdBy: adminId,
      createdByEmail: adminEmail,
      viewCount: 0,
      readCount: 0,
      metadata: {
        version: 1,
        lastModified: functions.serverTimestamp()
      }
    };

    const docRef = await functions.addDoc(
      functions.collection(db, 'announcements'),
      announcementData
    );

    // 管理者アクションをログ
    await logAdminAction(adminId, adminEmail, 'create_announcement', {
      announcementId: docRef.id,
      title: data.title,
      type: data.type,
      targetAudience: data.targetAudience
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating announcement:', error);
    throw error;
  }
};

export const updateAnnouncement = async (
  announcementId: string,
  updates: Partial<Announcement>,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  if (isServer) throw new Error('Cannot run on server');
  
  const db = await getFirestore();
  if (!db) throw new Error('Firestore not initialized');
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) throw new Error('Firestore functions not loaded');
  
  try {
    // システムフィールドを除外
    const cleanUpdates = { ...updates };
    delete cleanUpdates.id;
    delete cleanUpdates.createdAt;
    delete cleanUpdates.createdBy;
    delete cleanUpdates.viewCount;
    delete cleanUpdates.readCount;
    
    // 更新メタデータ追加
    cleanUpdates.updatedAt = functions.serverTimestamp();
    cleanUpdates.updatedBy = adminId;
    
    if (cleanUpdates.metadata) {
      cleanUpdates.metadata = {
        ...cleanUpdates.metadata,
        version: functions.increment(1),
        lastModified: functions.serverTimestamp()
      };
    }

    await functions.updateDoc(
      functions.doc(db, 'announcements', announcementId),
      cleanUpdates
    );

    // 管理者アクションをログ
    await logAdminAction(adminId, adminEmail, 'update_announcement', {
      announcementId,
      updates: Object.keys(cleanUpdates)
    });

  } catch (error) {
    console.error('Error updating announcement:', error);
    throw error;
  }
};

export const deleteAnnouncement = async (
  announcementId: string,
  adminId: string,
  adminEmail: string
): Promise<void> => {
  if (isServer) throw new Error('Cannot run on server');
  
  const db = await getFirestore();
  if (!db) throw new Error('Firestore not initialized');
  
  const functions = await loadFirestoreFunctions();
  if (!functions.updateDoc || !functions.doc) throw new Error('Firestore functions not loaded');
  
  try {
    // ソフト削除
    await functions.updateDoc(
      functions.doc(db, 'announcements', announcementId),
      {
        isActive: false,
        deletedAt: functions.serverTimestamp(),
        deletedBy: adminId,
        deletedByEmail: adminEmail
      }
    );

    // 管理者アクションをログ
    await logAdminAction(adminId, adminEmail, 'delete_announcement', {
      announcementId
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    throw error;
  }
};

export const getAnnouncements = async (
  page: number = 1,
  limit: number = 20,
  type?: string,
  status: 'all' | 'active' | 'inactive' = 'all'
): Promise<{ announcements: Announcement[]; hasMore: boolean }> => {
  if (isServer) return { announcements: [], hasMore: false };
  
  const db = await getFirestore();
  if (!db) return { announcements: [], hasMore: false };
  
  const functions = await loadFirestoreFunctions();
  if (!functions.query || !functions.collection || !functions.orderBy || !functions.getDocs) {
    return { announcements: [], hasMore: false };
  }
  
  try {
    let q = functions.query(
      functions.collection(db, 'announcements'),
      functions.orderBy('createdAt', 'desc')
    );
    
    // フィルター適用
    if (type && type !== 'all') {
      q = functions.query(q, functions.where('type', '==', type));
    }
    
    if (status === 'active') {
      q = functions.query(q, functions.where('isActive', '==', true));
    } else if (status === 'inactive') {
      q = functions.query(q, functions.where('isActive', '==', false));
    }

    // ページング
    q = functions.query(q, functions.limit(limit + 1)); // +1 for hasMore check
    
    const snapshot = await functions.getDocs(q);
    const announcements = snapshot.docs.slice(0, limit).map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate()
    })) as Announcement[];

    const hasMore = snapshot.docs.length > limit;

    return { announcements, hasMore };
  } catch (error) {
    console.error('Error getting announcements:', error);
    return { announcements: [], hasMore: false };
  }
};

// ========== 統計情報取得関数 ==========

export const getUserStats = async (): Promise<UserStats> => {
  if (isServer) return getDefaultUserStats();
  
  const db = await getFirestore();
  if (!db) return getDefaultUserStats();
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDocs || !functions.collection || !functions.where) {
    return getDefaultUserStats();
  }
  
  try {
    // 並列で統計を取得
    const [
      totalUsersSnap,
      totalGuidesSnap,
      totalGuestsSnap,
      verifiedUsersSnap,
      completedProfilesSnap
    ] = await Promise.all([
      functions.getDocs(functions.collection(db, 'users')),
      functions.getDocs(functions.query(
        functions.collection(db, 'users'),
        functions.where('role', '==', 'guide')
      )),
      functions.getDocs(functions.query(
        functions.collection(db, 'users'),
        functions.where('role', '==', 'guest')
      )),
      functions.getDocs(functions.query(
        functions.collection(db, 'users'),
        functions.where('activated', '==', true)
      )),
      functions.getDocs(functions.query(
        functions.collection(db, 'users'),
        functions.where('profileCompleted', '==', true)
      ))
    ]);

    const totalUsers = totalUsersSnap.size;
    const totalGuides = totalGuidesSnap.size;
    const totalGuests = totalGuestsSnap.size;
    const verifiedUsers = verifiedUsersSnap.size;
    const completedProfiles = completedProfilesSnap.size;

    return {
      totalUsers,
      activeUsers: verifiedUsers, // 認証済み = アクティブとみなす
      totalGuides,
      totalGuests,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      completedProfiles,
      incompleteProfiles: totalUsers - completedProfiles
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return getDefaultUserStats();
  }
};

export const getAnnouncementStats = async (): Promise<AnnouncementStats> => {
  if (isServer) return getDefaultAnnouncementStats();
  
  const db = await getFirestore();
  if (!db) return getDefaultAnnouncementStats();
  
  const functions = await loadFirestoreFunctions();
  if (!functions.getDocs || !functions.collection || !functions.where) {
    return getDefaultAnnouncementStats();
  }
  
  try {
    const [allAnnouncementsSnap, activeAnnouncementsSnap] = await Promise.all([
      functions.getDocs(functions.collection(db, 'announcements')),
      functions.getDocs(functions.query(
        functions.collection(db, 'announcements'),
        functions.where('isActive', '==', true)
      ))
    ]);

    const totalAnnouncements = allAnnouncementsSnap.size;
    const activeAnnouncements = activeAnnouncementsSnap.size;

    // 総閲覧数と最も閲覧されたお知らせを計算
    let totalViews = 0;
    let mostViewedAnnouncement;
    let maxViews = 0;

    allAnnouncementsSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      const viewCount = data.viewCount || 0;
      totalViews += viewCount;
      
      if (viewCount > maxViews) {
        maxViews = viewCount;
        mostViewedAnnouncement = {
          id: doc.id,
          title: data.title,
          viewCount
        };
      }
    });

    const averageViewsPerAnnouncement = totalAnnouncements > 0 
      ? Math.round(totalViews / totalAnnouncements) 
      : 0;

    return {
      totalAnnouncements,
      activeAnnouncements,
      totalViews,
      averageViewsPerAnnouncement,
      mostViewedAnnouncement
    };
  } catch (error) {
    console.error('Error getting announcement stats:', error);
    return getDefaultAnnouncementStats();
  }
};

// ========== 管理者アクションログ ==========

const logAdminAction = async (
  adminId: string,
  adminEmail: string,
  action: string,
  metadata: Record<string, any> = {}
): Promise<void> => {
  if (isServer) return;
  
  const db = await getFirestore();
  if (!db) return;
  
  const functions = await loadFirestoreFunctions();
  if (!functions.addDoc || !functions.collection) return;
  
  try {
    await functions.addDoc(functions.collection(db, 'admin_audit_logs'), {
      adminId,
      adminEmail,
      action,
      metadata,
      timestamp: functions.serverTimestamp(),
      ipAddress: null // ブラウザからは取得困難
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// ========== デフォルト値関数 ==========

function getDefaultUserStats(): UserStats {
  return {
    totalUsers: 0,
    activeUsers: 0,
    totalGuides: 0,
    totalGuests: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
    completedProfiles: 0,
    incompleteProfiles: 0
  };
}

function getDefaultAnnouncementStats(): AnnouncementStats {
  return {
    totalAnnouncements: 0,
    activeAnnouncements: 0,
    totalViews: 0,
    averageViewsPerAnnouncement: 0
  };
}