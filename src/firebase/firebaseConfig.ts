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

// Firestoreを条件付きで初期化
let db: any = null;

// Firebaseのバージョンに応じて異なる方法で初期化を試行
const initFirestore = () => {
  try {
    // まず通常のインポートを試行
    const firestore = require("firebase/firestore");
    if (firestore && firestore.getFirestore) {
      db = firestore.getFirestore(app);
      return true;
    }
  } catch (error) {
    console.warn("Standard Firestore import failed:", error);
  }
  
  try {
    // 代替インポート方法を試行
    const firestore = require("firebase/firestore/lite");
    if (firestore && firestore.getFirestore) {
      db = firestore.getFirestore(app);
      return true;
    }
  } catch (error) {
    console.warn("Lite Firestore import failed:", error);
  }
  
  return false;
};

// 初期化を実行
if (!initFirestore()) {
  console.error("Failed to initialize Firestore. Please check your Firebase installation.");
}

export { db };
export const auth = getAuth(app);