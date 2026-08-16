import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';

// Load backend/.env explicitly, resolved from this module's location rather than process.cwd().
// `dotenv/config` reads `<cwd>/.env`, so launching the server from anywhere but the backend
// directory left every variable (FETCH_AI_*, FIREBASE_*) unset. Resolving relative to the
// compiled/source file location makes startup robust to the working directory.
loadEnv({ path: resolve(__dirname, '../.env') });

import express, { type NextFunction, type Request, type Response } from 'express';
import { cors } from './middleware/cors';
import { specificationsRouter } from './api/specifications.route';
import { mySpecificationsRouter } from './api/mySpecifications.route';
import { verifyFirebaseAdmin } from './lib/firebaseAdmin';

// Express app + server bootstrap (T010). The configured `app` is exported so HTTP contract
// tests (T039) can import it with Supertest without binding a port; the server only starts
// listening when this module is run directly.
export const app = express();

// Allow the deployed frontend origin (cross-origin in production) + handle preflight. Mounted
// first so every route — including the SSE stream and preflighted /api/me calls — gets headers.
app.use(cors);

// Idea text is at most ~2,000 chars (FR-006); a small bounded body limit is plenty.
app.use(express.json({ limit: '64kb' }));

// Health check — lets deployment and local setup verify the server is up.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Generation endpoints: POST /api/specifications and GET /api/specifications/:id/stream.
app.use('/api', specificationsRouter);

// Authenticated persistence endpoints (feature/firebase-auth): /api/me/specifications.
// These are token-protected and separate from the anonymous generation flow above.
app.use('/api/me', mySpecificationsRouter);

// 404 for unknown routes.
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'not_found', message: 'Resource not found.' });
});

// Centralized error handler. Deliberately logs only method, path, and error name — never
// request/response bodies, since idea text and specification content must not appear in any
// log output (FR-017).
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const errorName = err instanceof Error ? err.name : 'UnknownError';
  console.error(`[error] ${req.method} ${req.path}: ${errorName}`);
  res.status(500).json({ error: 'internal_error', message: 'Something went wrong.' });
});

const PORT = Number(process.env.PORT) || 4000;

if (require.main === module) {
  // Verify Firebase Admin at boot so any misconfiguration is logged now, not on first request.
  verifyFirebaseAdmin();
  app.listen(PORT, () => {
    console.log(`SpecPilot backend listening on port ${PORT}`);
  });
}
