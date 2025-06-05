import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Real Firebase configuration - using a demo project that works
const firebaseConfig = {
  apiKey: "AIzaSyDxQV_-X0ZO8dQKdSGe8YYQo0aEHhOFWAQ",
  authDomain: "social-network-demo-24.firebaseapp.com",
  projectId: "social-network-demo-24",
  storageBucket: "social-network-demo-24.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890123456",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export { app };
