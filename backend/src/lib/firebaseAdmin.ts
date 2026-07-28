// Firebase Admin bootstrap (feature/firebase-auth, Phase 1). This is the ONLY place the
// backend touches Firebase: the auth middleware uses `getAdminAuth()` to verify user ID
// tokens, and the specification store uses `getDb()` to read/write Firestore with the Admin
// SDK. Because the Admin SDK runs with service-account privileges it bypasses Firestore
// Security Rules — so the rules stay deny-all for clients and this middleware is the sole
// authorization boundary (see firestore.rules).
//
// All configuration comes from environment variables — no credentials are hardcoded (project
// constitution: Environment). Config is read and the app initialized lazily on first use (not
// at module load) so that importing modules for tests, and starting the server without the
// persistence feature configured, never crashes on a missing service account.

import { readFileSync } from 'fs';
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/** Raised when Firebase Admin is misconfigured (missing/invalid service account). */
export class FirebaseAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAdminError';
  }
}

/**
 * Loads the service-account credential from the environment. Two supported forms:
 *  - FIREBASE_SERVICE_ACCOUNT      — the service-account JSON inlined as a string (handy for
 *                                    hosted deployments that inject secrets as env vars).
 *  - FIREBASE_SERVICE_ACCOUNT_PATH — a path to the service-account JSON file on disk (handy
 *                                    for local development).
 * The inline form wins if both are set. Throws FirebaseAdminError with a clear message if
 * neither is present or the JSON cannot be parsed.
 */
function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let raw: string;
  if (inline && inline.trim() !== '') {
    raw = inline;
  } else if (path && path.trim() !== '') {
    try {
      raw = readFileSync(path, 'utf8');
    } catch {
      throw new FirebaseAdminError(
        `Could not read the service account file at FIREBASE_SERVICE_ACCOUNT_PATH (${path}).`,
      );
    }
  } else {
    throw new FirebaseAdminError(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT (inline JSON) or ' +
        'FIREBASE_SERVICE_ACCOUNT_PATH (path to the service account JSON file).',
    );
  }

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new FirebaseAdminError('The Firebase service account credential is not valid JSON.');
  }
}

let app: App | undefined;

/** Initializes (once) and returns the Firebase Admin app. */
function getApp(): App {
  if (app) {
    return app;
  }
  // Reuse an already-initialized default app if present (e.g. across test reloads).
  const existing = getApps();
  if (existing.length > 0) {
    app = existing[0];
    return app;
  }

  const credential = cert(loadServiceAccount());
  const projectId = process.env.FIREBASE_PROJECT_ID || undefined;
  app = initializeApp({ credential, projectId });
  return app;
}

/** Firebase Admin Auth instance — used to verify client ID tokens. */
export function getAdminAuth(): Auth {
  return getAuth(getApp());
}

/** Firestore (Admin SDK) instance — used to persist and read saved specifications. */
export function getDb(): Firestore {
  return getFirestore(getApp());
}
