// firebase.ts
import { initializeApp, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Define the type for the Firebase configuration
const firebaseConfig: { 
  apiKey: string; 
  authDomain: string; 
  projectId: string; 
  storageBucket: string; 
  messagingSenderId: string; 
  appId: string; 
  measurementId: string; 
} = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || '',
};

// Check for required fields
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error("Firebase configuration is missing required environment variables.");
}
// Firebase initialization only on the client-side
let app: FirebaseApp | undefined;

if (typeof window !== 'undefined') {

  try {
    // Try to initialize the app, which may already be initialized
    app = initializeApp(firebaseConfig);
    console.log('Firebase client initialized');
  } catch (error) {
    // If it's already initialized, just get the existing app
    app = getApp();  // `getApp` gets the existing default app
    console.log('Firebase already initialized');
  }
}

export const auth = app ? getAuth(app) : null;
export default app;
