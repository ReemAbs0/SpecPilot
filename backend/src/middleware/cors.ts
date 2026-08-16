import type { NextFunction, Request, Response } from 'express';

// CORS for the deployed frontend (deployment). In production the frontend (Vercel) and backend
// (Render) are on different origins, so the browser requires CORS headers — including a preflight
// for the Authorization header used by the /api/me endpoints, and Access-Control-Allow-Origin on
// the SSE stream. Allowed origins come from CORS_ORIGIN (comma-separated); if unset, all origins
// are allowed (convenient for local/dev, but set it in production).

function allowedOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function cors(req: Request, res: Response, next: NextFunction): void {
  const allowlist = allowedOrigins();
  const requestOrigin = req.headers.origin;

  if (allowlist.length === 0) {
    // No allowlist configured — reflect any origin (permissive). Set CORS_ORIGIN to lock down.
    res.setHeader('Access-Control-Allow-Origin', requestOrigin ?? '*');
  } else if (requestOrigin && allowlist.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }
  // Responses vary by request origin, so caches must key on it.
  res.setHeader('Vary', 'Origin');
  // PATCH/DELETE are used by the rename and delete endpoints under /api/me/specifications/:id.
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Short-circuit preflight requests.
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
