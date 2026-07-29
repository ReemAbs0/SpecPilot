// Base URL for backend API calls (deployment). In development this is empty, so calls stay
// relative (`/api/...`) and the Vite dev proxy forwards them to the backend. In production the
// frontend (Vercel) and backend (Render) are on different origins, so VITE_API_BASE_URL is set
// to the backend's URL and calls become absolute + cross-origin (the backend enables CORS).

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** Builds a full API URL for a leading-slash path, e.g. apiUrl('/api/specifications'). */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
