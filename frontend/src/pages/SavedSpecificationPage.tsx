import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileQuestion } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { useSpecification } from '../state/SpecificationContext';
import {
  deleteSpecification,
  getSpecification,
  updateSpecificationTitle,
} from '../services/specificationStore';
import { ResultHeader } from '../components/result/ResultHeader';
import { SpecificationSections } from '../components/result/SpecificationSections';
import { ActionsPanel } from '../components/result/ActionsPanel';
import { Button, ConfirmDialog, Spinner } from '../components/ui';
import type { SavedSpecification } from '../types/savedSpecification.types';

// Saved-specification detail page (feature/firebase-auth, Phase 6). Fetches one saved record via
// GET /api/me/specifications/:id and renders it with the SAME layout and components as the live
// result page (ResultHeader + SpecificationSections + ActionsPanel) — no duplicated UI. This
// route is wrapped by RequireAuth, so a user is always present.
//
// The record can also be renamed in place (PATCH, via the shared ResultHeader) and deleted
// (DELETE, after confirmation) — deleting the specification that is open navigates back to the
// library, since this page no longer has anything to show.

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
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  /**
   * Renames this saved specification. Persists first and only mirrors the new title into local
   * state once Firestore accepted it; throwing lets the header show its inline error.
   */
  async function handleSaveTitle(nextTitle: string) {
    if (!user || !id) {
      throw new Error('not_ready');
    }
    const token = await user.getIdToken();
    const result = await updateSpecificationTitle(token, id, nextTitle);
    if (!result.ok) {
      throw new Error(result.error ?? 'rename_failed');
    }
    setState((current) =>
      current.status === 'ready'
        ? {
            status: 'ready',
            saved: {
              ...current.saved,
              title: nextTitle,
              specification: { ...current.saved.specification, title: nextTitle },
            },
          }
        : current,
    );
  }

  async function handleConfirmDelete() {
    if (!user || !id || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteSpecification(await user.getIdToken(), id);
      // Already gone (404) counts as deleted — either way this page has nothing left to show.
      if (result.ok || result.notFound) {
        setConfirmingDelete(false);
        navigate('/library', { replace: true });
        return;
      }
      setDeleteError('We couldn’t delete this specification. Please try again.');
    } catch {
      setDeleteError('We couldn’t delete this specification. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

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
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <FileQuestion className="h-7 w-7 text-slate-500 dark:text-slate-400" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-100">Specification not found</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
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
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-7 w-7 text-red-500 dark:text-red-400" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-slate-100">Couldn’t load specification</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400" role="alert">
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
        <ResultHeader
          title={spec.title}
          timestamp={formatSavedAt(state.saved.createdAt)}
          onSaveTitle={handleSaveTitle}
          onDelete={() => {
            setDeleteError(null);
            setConfirmingDelete(true);
          }}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SpecificationSections specification={spec} />

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <ActionsPanel specification={spec} />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete specification?"
        message={
          <>“{state.saved.title}” will be permanently removed from your account. This can’t be undone.</>
        }
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setConfirmingDelete(false);
            setDeleteError(null);
          }
        }}
      />
    </div>
  );
}
