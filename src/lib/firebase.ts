import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCezi00B9yTnsE8GJsAp1eqymHbFIX8phk",
  authDomain: "eighth-technique-0lxdt.firebaseapp.com",
  projectId: "eighth-technique-0lxdt",
  storageBucket: "eighth-technique-0lxdt.firebasestorage.app",
  messagingSenderId: "988273207710",
  appId: "1:988273207710:web:d07e4d14b78fd6e7008e8f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-corretorfcilprof-368b7618-7996-47c3-a27f-da58a5bd6fea");
