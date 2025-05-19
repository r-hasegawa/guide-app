import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // firebaseConfig.ts で初期化済みの db を使う

// プロフィールを保存
export const saveUserProfile = async (uid: string, profile: any) => {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
};

// プロフィールを取得
export const getUserProfile = async (uid: string) => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};


