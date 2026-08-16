import { useCallback, useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { deleteSpecification } from '../services/specificationStore';

// The confirm-then-delete flow for a saved specification, shared by every place that offers the
// action (the library list, an open saved specification, and a freshly generated result that has
// been persisted). Each caller supplies only what happens afterwards — drop the row, go back to
// the library — while the prompt copy, the in-flight and error states, and the call into the
// service layer live here once (constitution Principle III: no persistence details in the UI).

/** The specification a delete prompt is currently about. */
export interface DeleteTarget {
  id: string;
  title: string;
}

/** Props to spread onto ConfirmDialog, so every delete prompt looks and reads the same. */
export interface DeleteDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busyLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface DeleteSpecificationFlow {
  /** Opens the confirmation prompt for one specification. */
  request: (target: DeleteTarget) => void;
  /** Props for the shared confirmation dialog. */
  dialogProps: DeleteDialogProps;
}

const FAILURE_MESSAGE = 'We couldn’t delete this specification. Please try again.';

/**
 * @param onDeleted Runs once the record is gone from Firestore, with the id that was deleted.
 */
export function useDeleteSpecification(onDeleted: (id: string) => void): DeleteSpecificationFlow {
  const { user } = useAuth();
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback((next: DeleteTarget) => {
    setError(null);
    setTarget(next);
  }, []);

  const cancel = useCallback(() => {
    // Never dismiss mid-delete: the outcome still has to be reported.
    if (!deleting) {
      setTarget(null);
      setError(null);
    }
  }, [deleting]);

  const confirm = useCallback(async () => {
    if (!user || !target || deleting) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteSpecification(await user.getIdToken(), target.id);
      // A 404 means it is already gone (deleted in another tab, say) — the caller should still
      // reconcile, so treat it as success rather than an error the user can do nothing about.
      if (result.ok || result.notFound) {
        setTarget(null);
        onDeleted(target.id);
      } else {
        setError(FAILURE_MESSAGE);
      }
    } catch {
      setError(FAILURE_MESSAGE);
    } finally {
      setDeleting(false);
    }
  }, [user, target, deleting, onDeleted]);

  return {
    request,
    dialogProps: {
      open: target !== null,
      title: 'Delete specification?',
      message: `“${target?.title ?? ''}” will be permanently removed from your account. This can’t be undone.`,
      confirmLabel: 'Delete',
      busyLabel: 'Deleting…',
      busy: deleting,
      error,
      onConfirm: () => void confirm(),
      onCancel: cancel,
    },
  };
}
