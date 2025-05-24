// src/firebase/firebaseConfig.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestoreの初期化（クライアントサイドのみ）
let db: any = null;

const initializeFirestore = () => {
  // サーバーサイドでは初期化しない
  if (typeof window === 'undefined') {
    return null;
  }

  if (db) {
    return db;
  }

  try {
    // 動的インポートを使用してクライアントサイドでのみFirestoreを初期化
    import("firebase/firestore").then((firestoreModule) => {
      if (firestoreModule && firestoreModule.getFirestore) {
        db = firestoreModule.getFirestore(app);
      }
    }).catch((error) => {
      console.error("Failed to load Firestore:", error);
    });
  } catch (error) {
    console.error("Firestore initialization failed:", error);
  }

  return db;
};

// クライアントサイドの場合のみ初期化を実行
if (typeof window !== 'undefined') {
  initializeFirestore();
}

export { db };
export const auth = getAuth(app);
export { initializeFirestore };