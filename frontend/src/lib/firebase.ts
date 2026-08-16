// Firebase Web SDK bootstrap (feature/firebase-auth, Phase 1). The frontend uses Firebase for
// AUTHENTICATION ONLY — it never talks to Firestore directly. Persistence goes through the
// backend (`/api/me/*`), which verifies the user's ID token and writes with the Admin SDK.
//
// Configuration comes from Vite env vars (VITE_FIREBASE_*, see .env.example). These values are
// public by design for a web client; the security boundary is the backend token check plus
// deny-all Firestore rules, not the secrecy of this config.

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

/** Shared Auth instance used by AuthContext and the API service (for ID tokens). */
export const auth: Auth = getAuth(firebaseApp);
