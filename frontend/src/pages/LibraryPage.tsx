import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { listSpecifications } from '../services/specificationStore';
import { Button, Spinner, Surface } from '../components/ui';
import { SpecificationCard } from '../components/library/SpecificationCard';
import type { SavedSpecificationSummary } from '../types/savedSpecification.types';

// The saved-specifications library (feature/firebase-auth, Phase 5). Loads the signed-in user's
// specifications from GET /api/me/specifications and lists them newest-first. This route is
// wrapped by RequireAuth, so a user is always present when it renders. Auth and generation
// behavior are untouched — this only reads persisted data.

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; specifications: SavedSpecificationSummary[] };

/** Sorts newest-first defensively; a null/pending createdAt is treated as the most recent. */
function sortNewestFirst(items: SavedSpecificationSummary[]): SavedSpecificationSummary[] {
  const time = (value: string | null): number => {
    if (!value) {
      return Number.POSITIVE_INFINITY;
    }
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  };
  return [...items].sort((a, b) => time(b.createdAt) - time(a.createdAt));
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!user) {
      return;
    }
    // No synchronous setState here: the initial state is already 'loading', and this guarded
    // page only ever mounts with a stable user, so the effect runs once. setState happens in
    // the async callback below once the request resolves.
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const result = await listSpecifications(token);
        if (cancelled) {
          return;
        }
        setState(
          result.ok
            ? { status: 'ready', specifications: sortNewestFirst(result.specifications ?? []) }
            : { status: 'error' },
        );
      } catch {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">My Specifications</h1>
      <p className="mt-2 text-slate-500">
        Every specification you generate while signed in is saved here.
      </p>

      <div className="mt-8">
        {state.status === 'loading' && (
          <div className="flex justify-center py-16">
            <Spinner label="Loading your specifications…" />
          </div>
        )}

        {state.status === 'error' && (
          <Surface
            surface="rounded-2xl border border-slate-100 bg-white shadow-card"
            className="flex flex-col items-center p-10 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-500" aria-hidden="true" />
            </span>
            <p className="mt-4 text-slate-600" role="alert">
              We couldn’t load your specifications. Please try again.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Surface>
        )}

        {state.status === 'ready' && state.specifications.length === 0 && (
          <Surface
            surface="rounded-2xl border border-slate-100 bg-white shadow-card"
            className="flex flex-col items-center p-12 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
              <FolderOpen className="h-6 w-6 text-brand-600" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No specifications yet</h2>
            <p className="mt-1 max-w-sm text-slate-500">
              Generate your first specification and it will automatically be saved to your account.
            </p>
            <Link to="/generate" className="mt-5">
              <Button variant="primary">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Generate a Specification
              </Button>
            </Link>
          </Surface>
        )}

        {state.status === 'ready' && state.specifications.length > 0 && (
          <ul className="flex flex-col gap-3">
            {state.specifications.map((spec) => (
              <li key={spec.id}>
                <SpecificationCard spec={spec} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
