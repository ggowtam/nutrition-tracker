import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config - using fallback values
const firebaseConfig = {
  apiKey: "AIzaSyBTKdylbBH1rAaedmpz1mauyEMIR8JLU78",
  authDomain: "nutrition-tracker-7664e.firebaseapp.com",
  projectId: "nutrition-tracker-7664e",
  storageBucket: "nutrition-tracker-7664e.firebasestorage.app",
  messagingSenderId: "728366730885",
  appId: "1:728366730885:web:c26abc123bed420cbe63ec",
  measurementId: "G-8YYWRWQ2WY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Firestore Database
export const db = getFirestore(app);

export default app;
