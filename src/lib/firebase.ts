
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "quizwhiz-gs6fd",
  "appId": "1:1074624854644:web:16246065a775fc324a6f21",
  "storageBucket": "quizwhiz-gs6fd.firebasestorage.app",
  "apiKey": "AIzaSyCt_eR6sE-IG2T-7br467sGTT7Cnh-zRik",
  "authDomain": "quizwhiz-gs6fd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1074624854644"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
