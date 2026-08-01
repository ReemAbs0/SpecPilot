import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { Button } from './Button';
import { Surface } from './Surface';

// Modal confirmation prompt for irreversible actions (currently: deleting a saved
// specification). Presentational and theme-agnostic — it is built from the existing Surface and
// Button primitives, so it follows Classic/Material and light/dark automatically, and it owns no
// business logic: the caller decides what confirming means and passes `busy`/`error` back in
// while the work runs.
//
// Deliberately a plain in-tree overlay rather than window.confirm(): a native dialog can't show
// the in-flight or failed state, and it blocks the whole page.

export interface ConfirmDialogProps {
  open: boolean;
  /** Short headline, e.g. "Delete specification?". */
  title: string;
  /** Explanatory body text. */
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Confirm-button label while the action runs. */
  busyLabel?: string;
  /** True while the confirmed action runs: buttons disable and dismissal is blocked. */
  busy?: boolean;
  /** User-facing failure message shown inside the dialog; the dialog stays open so they retry. */
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  busyLabel = 'Working…',
  busy = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const headingId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  // The element that opened the dialog, so focus can go back where the user left it.
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    openerRef.current = document.activeElement;
    // Focus the non-destructive action first — nobody should delete by hitting Enter reflexively.
    cancelRef.current?.focus();
    return () => {
      (openerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      // Clicking the backdrop dismisses, but never mid-action (the click would be ignored anyway
      // and the disappearing dialog would hide the outcome).
      onClick={() => {
        if (!busy) {
          onCancel();
        }
      }}
    >
      <Surface
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={messageId}
        surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
        className="w-full max-w-md p-6"
        onClick={(event: MouseEvent) => event.stopPropagation()}
      >
        <h2 id={headingId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        <div id={messageId} className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </Surface>
    </div>
  );
}
