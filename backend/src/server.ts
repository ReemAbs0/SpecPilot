import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';

// Express app + server bootstrap (T010). The configured `app` is exported so HTTP contract
// tests (T039) can import it with Supertest without binding a port; the server only starts
// listening when this module is run directly.
export const app = express();

// Idea text is at most ~2,000 chars (FR-006); a small bounded body limit is plenty.
app.use(express.json({ limit: '64kb' }));

// Health check — lets deployment and local setup verify the server is up.
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// User-story routes (POST /api/specifications and the SSE stream) are registered here in
// later tasks (T021, T022).

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
  app.listen(PORT, () => {
    console.log(`SpecPilot backend listening on port ${PORT}`);
  });
}
