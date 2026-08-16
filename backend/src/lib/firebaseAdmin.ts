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
import { isAbsolute, resolve } from 'path';
import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// The backend project root, derived from this module's location rather than process.cwd().
// src/lib/firebaseAdmin.ts and dist/lib/firebaseAdmin.js are both two levels below the backend
// root, so a relative FIREBASE_SERVICE_ACCOUNT_PATH resolves the same way no matter which
// directory the server is launched from.
const BACKEND_ROOT = resolve(__dirname, '../../');

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
  const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  let raw: string;
  if (inline && inline.trim() !== '') {
    console.log('[firebase-admin] loading service account from FIREBASE_SERVICE_ACCOUNT (inline).');
    raw = inline;
  } else if (configuredPath && configuredPath.trim() !== '') {
    // Resolve a relative path against the backend root, not process.cwd(), so it is found no
    // matter where the server was launched from.
    const absolutePath = isAbsolute(configuredPath)
      ? configuredPath
      : resolve(BACKEND_ROOT, configuredPath);
    console.log(`[firebase-admin] loading service account from file: ${absolutePath}`);
    try {
      raw = readFileSync(absolutePath, 'utf8');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const message = `Could not read the service account file at ${absolutePath} (from FIREBASE_SERVICE_ACCOUNT_PATH="${configuredPath}"): ${reason}`;
      console.error(`[firebase-admin] ${message}`);
      throw new FirebaseAdminError(message);
    }
  } else {
    const message =
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT (inline JSON) or ' +
      'FIREBASE_SERVICE_ACCOUNT_PATH (path to the service account JSON file). ' +
      'If they are set in backend/.env, make sure the server is started so that .env is loaded.';
    console.error(`[firebase-admin] ${message}`);
    throw new FirebaseAdminError(message);
  }

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    const message = 'The Firebase service account credential is not valid JSON.';
    console.error(`[firebase-admin] ${message}`);
    throw new FirebaseAdminError(message);
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

  const serviceAccount = loadServiceAccount();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    (serviceAccount as { project_id?: string }).project_id ||
    undefined;
  try {
    app = initializeApp({ credential: cert(serviceAccount), projectId });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[firebase-admin] Admin SDK initialization failed: ${reason}`);
    throw error;
  }
  console.log(`[firebase-admin] initialized for project "${projectId ?? '(unknown)'}".`);
  return app;
}

/**
 * Eagerly attempts initialization and reports the outcome — intended to be called once at
 * server startup so a misconfiguration is visible in the logs immediately (rather than only on
 * the first /api/me request). Never throws: persistence is optional, so a failure here must not
 * stop the server. Returns true when Firebase Admin is ready.
 */
export function verifyFirebaseAdmin(): boolean {
  try {
    getApp();
    return true;
  } catch {
    // loadServiceAccount / initializeApp already logged the specific reason above.
    console.warn(
      '[firebase-admin] not configured — the /api/me persistence endpoints will return ' +
        '"auth_unavailable" until this is fixed. The generation flow is unaffected.',
    );
    return false;
  }
}

/** Firebase Admin Auth instance — used to verify client ID tokens. */
export function getAdminAuth(): Auth {
  return getAuth(getApp());
}

/** Firestore (Admin SDK) instance — used to persist and read saved specifications. */
export function getDb(): Firestore {
  return getFirestore(getApp());
}
