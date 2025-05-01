// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAH93WwphTZnCKhfmZv0EXz2ZC2LMJRfCU",
  authDomain: "arabic-vocabulary-app.firebaseapp.com",
  projectId: "arabic-vocabulary-app",
  storageBucket: "arabic-vocabulary-app.firebasestorage.app",
  messagingSenderId: "416598620126",
  appId: "1:416598620126:web:ced53e36c34b9ed25bcf4f",
  measurementId: "G-3YGS96ZS1F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
