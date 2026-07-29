import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileQuestion } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { useSpecification } from '../state/SpecificationContext';
import { getSpecification } from '../services/specificationStore';
import { ResultHeader } from '../components/result/ResultHeader';
import { SpecificationSections } from '../components/result/SpecificationSections';
import { ActionsPanel } from '../components/result/ActionsPanel';
import { Button, Spinner } from '../components/ui';
import type { SavedSpecification } from '../types/savedSpecification.types';

// Saved-specification detail page (feature/firebase-auth, Phase 6). Fetches one saved record via
// GET /api/me/specifications/:id and renders it with the SAME layout and components as the live
// result page (ResultHeader + SpecificationSections + ActionsPanel) — no duplicated UI. This
// route is wrapped by RequireAuth, so a user is always present.

type LoadState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ready'; saved: SavedSpecification };

/** Formats the saved timestamp for the result header. */
function formatSavedAt(createdAt: string | null): string {
  if (!createdAt) {
    return 'Saved just now';
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return 'Saved';
  }
  return `Saved ${date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
}

function BackLink() {
  return (
    <Link
      to="/library"
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to My Specifications
    </Link>
  );
}

export default function SavedSpecificationPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { dispatch } = useSpecification();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!user || !id) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const result = await getSpecification(token, id);
        if (cancelled) {
          return;
        }
        if (result.ok && result.saved) {
          // Seed the idea so the reused ActionsPanel's "Generate Again" regenerates from THIS
          // saved specification's idea (and the downstream retry/save use it too).
          dispatch({ type: 'SET_IDEA', text: result.saved.idea });
          setState({ status: 'ready', saved: result.saved });
        } else if (result.notFound) {
          setState({ status: 'notfound' });
        } else {
          setState({ status: 'error' });
        }
      } catch {
        if (!cancelled) {
          setState({ status: 'error' });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, id, dispatch]);

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <BackLink />
        <div className="mt-8 flex justify-center py-12">
          <Spinner label="Loading specification…" />
        </div>
      </div>
    );
  }

  if (state.status === 'notfound') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <FileQuestion className="h-7 w-7 text-slate-500" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Specification not found</h1>
        <p className="mt-2 text-slate-500">
          This specification doesn’t exist or isn’t in your account.
        </p>
        <Link to="/library" className="mt-6">
          <Button variant="primary">Back to My Specifications</Button>
        </Link>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Couldn’t load specification</h1>
        <p className="mt-2 text-slate-500" role="alert">
          Something went wrong loading this specification. Please try again.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Link to="/library">
            <Button variant="secondary">Back to My Specifications</Button>
          </Link>
        </div>
      </div>
    );
  }

  const spec = state.saved.specification;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <BackLink />
      <div className="mt-4">
        <ResultHeader title={spec.title} timestamp={formatSavedAt(state.saved.createdAt)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SpecificationSections specification={spec} />

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <ActionsPanel specification={spec} />
          </div>
        </aside>
      </div>
    </div>
  );
}
