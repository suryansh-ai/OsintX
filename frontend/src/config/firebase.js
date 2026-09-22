// Firebase Configuration for Phone Authentication
// Get these values from Firebase Console: https://console.firebase.google.com
// 1. Create a new project or select existing
// 2. Go to Project Settings > General > Your apps > Add app (Web)
// 3. Copy the config values below
// 4. Enable Phone Authentication in Firebase Console: Authentication > Sign-in method > Phone

import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Replace these with your Firebase project config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// For development - allows testing without actual SMS
// auth.settings.appVerificationDisabledForTesting = true;

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export default app;
