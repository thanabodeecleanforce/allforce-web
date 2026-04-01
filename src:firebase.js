import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// นำ Config จากโปรเจกต์ Firebase ของคุณมาวางตรงนี้
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "allforce-hub.firebaseapp.com",
  projectId: "allforce-hub",
  storageBucket: "allforce-hub.firebasestorage.app",
  messagingSenderId: "206898849342",
  appId: "1:206898849342:web:..."
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);