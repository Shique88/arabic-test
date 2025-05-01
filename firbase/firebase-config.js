// Your Firebase configuration
// Replace these values with your Firebase project configuration
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
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Set persistence to local to keep the user logged in even after refreshing the page
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
