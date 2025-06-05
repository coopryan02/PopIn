import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Demo Firebase configuration that works without emulators
const firebaseConfig = {
  apiKey: "AIzaSyBqWYbSxs9Q6QwBYKRKOz0z0z0z0z0z0z0",
  authDomain: "social-network-demo-default-rtdb.firebaseapp.com",
  projectId: "social-network-demo-default-rtdb",
  storageBucket: "social-network-demo-default-rtdb.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890123456",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Only connect to emulators in development if they are explicitly enabled
const USE_EMULATOR = import.meta.env.VITE_USE_FIREBASE_EMULATOR === "true";

if (import.meta.env.DEV && USE_EMULATOR) {
  try {
    // Connect to Auth emulator only if explicitly enabled
    if (!auth._delegate._config?.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", {
        disableWarnings: true,
      });
    }
  } catch (error) {
    console.warn("Could not connect to Auth emulator:", error);
  }

  try {
    // Connect to Firestore emulator only if explicitly enabled
    if (!db._delegate._databaseId.projectId.includes("localhost")) {
      connectFirestoreEmulator(db, "localhost", 8080);
    }
  } catch (error) {
    console.warn("Could not connect to Firestore emulator:", error);
  }
}

export { app };
