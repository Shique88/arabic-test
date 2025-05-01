// Your Firebase configuration
// Replace these values with your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBy-IH4O09676ijBZ3rT78Fd829Pa7fPRc",
    authDomain: "arabic-test-62c4c.firebaseapp.com",
    projectId: "arabic-test-62c4c",
    storageBucket: "arabic-test-62c4c.firebasestorage.app",
    messagingSenderId: "497421340802",
    appId: "1:497421340802:web:82036ff8450370a22da49b",
    measurementId: "G-E9J905YKEV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

// Set persistence to local to keep the user logged in even after refreshing the page
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
