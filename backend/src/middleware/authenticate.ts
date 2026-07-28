import type { NextFunction, Request, Response } from 'express';
import { FirebaseAdminError, getAdminAuth } from '../lib/firebaseAdmin';

// Firebase ID-token authentication for the /api/me routes (feature/firebase-auth, Phase 4a).
// Reads a `Authorization: Bearer <idToken>` header, verifies the token with the Admin SDK, and
// attaches the resolved uid to the request. This middleware is the SOLE authorization boundary
// for persistence (Firestore rules deny all direct client access), so it is applied to every
// /api/me route and never to the generation routes.

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by `authenticate` once a valid ID token has been verified. */
      uid?: string;
    }
  }
}

function extractBearerToken(header: string | undefined): string {
  if (!header || !header.startsWith('Bearer ')) {
    return '';
  }
  return header.slice('Bearer '.length).trim();
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req.headers.authorization);
  if (token === '') {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Missing or malformed Authorization header.',
    });
    return;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    // A missing/invalid service account is a server misconfiguration, not a bad token — surface
    // it as 500 so it is not mistaken for an auth failure. Never log token or request bodies.
    if (error instanceof FirebaseAdminError) {
      console.error(`[error] ${req.method} ${req.path}: ${error.name}`);
      res.status(500).json({
        error: 'auth_unavailable',
        message: 'Authentication is not configured on the server.',
      });
      return;
    }
    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or expired credentials.',
    });
  }
}
