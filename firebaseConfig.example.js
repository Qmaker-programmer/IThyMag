// =======================================================
//    iThyMag — firebaseConfig.example.js
//    Configuración de Firebase
//    Copia esto en src/firebaseConfig.js y pon tus llaves
// ========================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Reemplaza estos valores con los de tu proyecto en Firebase Console
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_ID",
  appId: "TU_APP_ID",
  // measurementId: "G-XXXXXXX" // Opcional: Solo si usas Google Analytics
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const googleProvider = provider;