import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCKJ7lQp_BBdbACF_2rYTtVcgct37gXnPo",
  authDomain: "dwebsite-95b5e.firebaseapp.com",
  projectId: "dwebsite-95b5e",
  storageBucket: "dwebsite-95b5e.firebasestorage.app",
  messagingSenderId: "171988455623",
  appId: "1:171988455623:web:517e884b8f7448cdfd6ee2",
  measurementId: "G-E16Z7B3J4L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
