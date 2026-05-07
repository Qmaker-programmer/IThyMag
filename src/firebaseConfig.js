// ================================================
//   iThyMag — firebaseConfig.js
//   Pega aquí tus credenciales de Firebase
// ================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAQlzJCk2qXI1bqcDzhPc85p2uHxUicock",
  authDomain: "ithymag.firebaseapp.com",
  projectId: "ithymag",
  storageBucket: "ithymag.firebasestorage.app",
  messagingSenderId: "833839969197",
  appId: "1:833839969197:web:7ad9a3041381f0e8dea724",
  measurementId: "G-6EPP21XPYJ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const googleProvider = provider; // alias para compatibilidad