// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = { 
  apiKey: "AIzaSyCKJ7lQp_BBdbACF_2rYTtVcgct37gXnPo", 
  authDomain: "dwebsite-95b5e.firebaseapp.com", 
  projectId: "dwebsite-95b5e", 
  storageBucket: "dwebsite-95b5e.firebasestorage.app", 
  messagingSenderId: "171988455623", 
  appId: "1:171988455623:web:517e884b8f7448cdfd6ee2", 
  measurementId: "G-E16Z7B3J4L" 
}; 

// Initialize Firebase
const app = initializeApp(firebaseConfig); 
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;