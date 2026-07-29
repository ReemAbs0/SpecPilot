import type { Specification } from '../types/specification.types';
import type {
  SavedSpecification,
  SavedSpecificationSummary,
} from '../types/savedSpecification.types';
import { apiUrl } from './apiBase';

// Talks to the authenticated persistence endpoints (feature/firebase-auth, Phase 4b/5). URLs
// are built via apiUrl() — relative in dev (Vite proxy), absolute cross-origin in production
// (VITE_API_BASE_URL → Render backend with CORS). Every call carries the caller's Firebase ID
// token as a Bearer credential; the backend verifies it and scopes all access to that user.

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
    response = await fetch(apiUrl('/api/me/specifications'), {
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

export interface ListResult {
  ok: boolean;
  specifications?: SavedSpecificationSummary[];
  /** Machine-readable failure hint for logging; never shown to the user. */
  error?: string;
}

/**
 * Lists the signed-in user's saved specifications (summaries). The backend returns them
 * newest-first; the Library page sorts defensively regardless. Returns a result object rather
 * than throwing so the page can render an error state.
 */
export async function listSpecifications(idToken: string): Promise<ListResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl('/api/me/specifications'), {
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    return { ok: false, error: 'network_error' };
  }

  if (response.status === 200) {
    try {
      const body = (await response.json()) as { specifications: SavedSpecificationSummary[] };
      return { ok: true, specifications: body.specifications ?? [] };
    } catch {
      return { ok: false, error: 'bad_response' };
    }
  }
  return { ok: false, error: `status_${response.status}` };
}

export interface GetResult {
  ok: boolean;
  saved?: SavedSpecification;
  /** True on a 404 — the id does not exist for this user (distinct from a generic error). */
  notFound?: boolean;
  /** Machine-readable failure hint for logging; never shown to the user. */
  error?: string;
}

/**
 * Fetches one saved specification in full by id. Distinguishes a 404 (notFound) from other
 * failures so the detail page can show the right state. Returns a result object, never throws.
 */
export async function getSpecification(idToken: string, id: string): Promise<GetResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/me/specifications/${encodeURIComponent(id)}`), {
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch {
    return { ok: false, error: 'network_error' };
  }

  if (response.status === 200) {
    try {
      const saved = (await response.json()) as SavedSpecification;
      return { ok: true, saved };
    } catch {
      return { ok: false, error: 'bad_response' };
    }
  }
  if (response.status === 404) {
    return { ok: false, notFound: true };
  }
  return { ok: false, error: `status_${response.status}` };
}
