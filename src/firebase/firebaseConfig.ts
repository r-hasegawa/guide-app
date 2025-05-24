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

// Firestoreの初期化を完全に分離
let db: any = null;
let dbInitialized = false;
let initializationPromise: Promise<any> | null = null;

const getFirestore = async () => {
  if (typeof window === 'undefined') {
    console.warn("Firestore called on server side");
    return null;
  }

  // 既に初期化済みの場合
  if (dbInitialized && db) {
    return db;
  }

  // 初期化中の場合は同じPromiseを返す
  if (initializationPromise) {
    return await initializationPromise;
  }

  // 新しい初期化を開始
  initializationPromise = (async () => {
    try {
      console.log("Initializing Firestore...");
      // @ts-ignore - 型エラーを回避
      const { getFirestore: getFirestoreFunc } = await import("firebase/firestore");
      db = getFirestoreFunc(app);
      dbInitialized = true;
      console.log("Firestore initialized successfully");
      return db;
    } catch (error) {
      console.error("Failed to initialize Firestore:", error);
      dbInitialized = false;
      db = null;
      return null;
    } finally {
      initializationPromise = null;
    }
  })();

  return await initializationPromise;
};

// dbのgetterを提供
const getDb = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return db;
};

export { getDb as db, getFirestore };
export const auth = getAuth(app);