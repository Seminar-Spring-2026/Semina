import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyC_dFvuY4ThaonLkFUNkj5RK0unTAVfUuI',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'semina-84274.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'semina-84274',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'semina-84274.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '679556105829',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:679556105829:web:84d679306eae432243a88c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-NZL1W7VXXR',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;

