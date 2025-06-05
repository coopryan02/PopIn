import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration - These are public and safe to expose
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "social-network-demo.firebaseapp.com",
  projectId: "social-network-demo",
  storageBucket: "social-network-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// For development - use Firebase emulators if available
if (import.meta.env.DEV) {
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, "http://localhost:9099", {
      disableWarnings: true,
    });
  } catch (error) {
    // Emulator already connected or not available
  }

  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch (error) {
    // Emulator already connected or not available
  }
}

export { app };
