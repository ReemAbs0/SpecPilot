import type { Specification } from '../types/specification.types';

// Talks to the authenticated persistence endpoints (feature/firebase-auth, Phase 4b). Like
// specificationApi.ts, it uses relative /api URLs so the Vite dev proxy (and same-origin
// production) route requests without CORS. Every call carries the caller's Firebase ID token
// as a Bearer credential; the backend verifies it and scopes all access to that user.

export interface SaveResult {
  ok: boolean;
  id?: string;
  /** Machine-readable failure hint for logging; never shown to the user. */
  error?: string;
}

/**
 * Persists a generated specification to the signed-in user's account.
 * Returns a result object rather than throwing — persistence is best-effort and must never
 * interrupt the generation/result flow.
 */
export async function saveSpecification(
  idToken: string,
  input: { idea: string; specification: Specification },
): Promise<SaveResult> {
  let response: Response;
  try {
    response = await fetch('/api/me/specifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: 'network_error' };
  }

  if (response.status === 201) {
    try {
      const body = (await response.json()) as { id: string };
      return { ok: true, id: body.id };
    } catch {
      // Saved, but the response body was unreadable — still a success from the user's view.
      return { ok: true };
    }
  }
  return { ok: false, error: `status_${response.status}` };
}
