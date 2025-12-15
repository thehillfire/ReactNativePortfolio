import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAmcfPnw8Ujl8SwbC10uhJFWVdqNUnI2uo",
  authDomain: "loreforgeauth.firebaseapp.com",
  projectId: "loreforgeauth",
  storageBucket: "loreforgeauth.firebasestorage.app",
  messagingSenderId: "157468713696",
  appId: "1:157468713696:web:f0214f5a000a79ac0a6685"
};

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore (will use default settings which work reliably on web)
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
