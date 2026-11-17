/**
 * Firebase Services Configuration & Initialization
 *
 * Configured for Ilm Essentials LMS project 'ilm-essentials-1'.
 * Implements dual-app architecture:
 * 1. Primary app (auth, db): Manages active user session & Firestore.
 * 2. Secondary app (adminAuthApp, adminAuth): Creates student Auth accounts
 *    in the background without logging out the currently signed-in Admin.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBGV0_7CMlmUAa4A0Wk3_5In3I6D9Uf2x4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ilm-essentials-1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ilm-essentials-1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ilm-essentials-1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '751902493351',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:751902493351:web:b7a2161fdc91fd7963e982',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4MREEJ51L8',
};

// 1. Primary Application Instance (Active Session)
const existingApps = getApps();
export const app = existingApps.length === 0 ? initializeApp(firebaseConfig) : existingApps[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// 2. Secondary Application Instance (Dedicated to background admin provisioning)
const existingAdminApp = existingApps.find((a) => a.name === 'AdminAuthApp');
export const adminAuthApp = existingAdminApp || initializeApp(firebaseConfig, 'AdminAuthApp');
export const adminAuth = getAuth(adminAuthApp);
