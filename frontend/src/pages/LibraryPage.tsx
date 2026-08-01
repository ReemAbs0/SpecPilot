import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, AlertTriangle, Sparkles } from 'lucide-react';
import { useAuth } from '../state/AuthContext';
import { deleteSpecification, listSpecifications } from '../services/specificationStore';
import { Button, ConfirmDialog, Spinner, Surface } from '../components/ui';
import { SpecificationCard } from '../components/library/SpecificationCard';
import type { SavedSpecificationSummary } from '../types/savedSpecification.types';

// The saved-specifications library (feature/firebase-auth, Phase 5). Loads the signed-in user's
// specifications from GET /api/me/specifications and lists them newest-first. This route is
// wrapped by RequireAuth, so a user is always present when it renders. Auth and generation
// behavior are untouched — this only reads persisted data.
//
// Each entry can be deleted: the card raises the intent, this page confirms it, calls
// DELETE /api/me/specifications/:id through the service layer, and drops the row from the list
// on success. Failures keep the dialog open with a message so nothing disappears silently.

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
  /** The specification awaiting delete confirmation; null when no prompt is open. */
  const [pendingDelete, setPendingDelete] = useState<SavedSpecificationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  function requestDelete(spec: SavedSpecificationSummary) {
    setDeleteError(null);
    setPendingDelete(spec);
  }

  function cancelDelete() {
    if (!deleting) {
      setPendingDelete(null);
      setDeleteError(null);
    }
  }

  /** Removes one specification from the list once Firestore has dropped it. */
  function removeFromList(id: string) {
    setState((current) =>
      current.status === 'ready'
        ? { ...current, specifications: current.specifications.filter((item) => item.id !== id) }
        : current,
    );
  }

  async function confirmDelete() {
    if (!user || !pendingDelete || deleting) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const token = await user.getIdToken();
      const result = await deleteSpecification(token, pendingDelete.id);
      // A 404 means it is already gone (e.g. deleted in another tab) — the list should still
      // stop showing it, so treat that as success rather than an error the user can't act on.
      if (result.ok || result.notFound) {
        removeFromList(pendingDelete.id);
        setPendingDelete(null);
      } else {
        setDeleteError('We couldn’t delete this specification. Please try again.');
      }
    } catch {
      setDeleteError('We couldn’t delete this specification. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">My Specifications</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
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
            surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
            className="flex flex-col items-center p-10 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-500 dark:text-red-400" aria-hidden="true" />
            </span>
            <p className="mt-4 text-slate-600 dark:text-slate-300" role="alert">
              We couldn’t load your specifications. Please try again.
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Surface>
        )}

        {state.status === 'ready' && state.specifications.length === 0 && (
          <Surface
            surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
            className="flex flex-col items-center p-12 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
              <FolderOpen className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No specifications yet</h2>
            <p className="mt-1 max-w-sm text-slate-500 dark:text-slate-400">
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
                <SpecificationCard spec={spec} onDelete={requestDelete} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete specification?"
        message={
          <>
            “{pendingDelete?.title}” will be permanently removed from your account. This can’t be
            undone.
          </>
        }
        confirmLabel="Delete"
        busyLabel="Deleting…"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
