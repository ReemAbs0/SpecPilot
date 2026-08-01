import { useRef, useState, type KeyboardEvent } from 'react';
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui';

// Result page header (T028): success status, timestamp, and the specification title with inline
// renaming. Clicking the pencil turns the title into a text field; Enter or clicking away saves,
// Escape cancels. The component stays presentational — it owns only its own edit UI state and
// delegates the actual save to `onSaveTitle`, which the page supplies (local state update plus
// persistence when the specification lives in the signed-in user's account). Without that prop
// the title is plain read-only text, exactly as before.
//
// A page that can delete the specification passes `onDelete`; the trash icon then sits beside
// the pencil as one icon group on the title line. Icon-only, so both actions carry an aria-label.

/** Shared look for the header's icon actions, so pencil and trash stay a matched pair. */
const ICON_BUTTON =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 ' +
  'dark:border-slate-700 text-slate-400 dark:text-slate-500 transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50';

export interface ResultHeaderProps {
  title: string;
  timestamp: string;
  /**
   * Applies a new (already trimmed, non-empty) title. Reject to report a failed save — the field
   * stays open with an error so the user's text is never lost. Omit to disable renaming.
   */
  onSaveTitle?: (title: string) => Promise<void>;
  /** Asks the page to delete this specification (it owns the confirmation). Omit to hide the action. */
  onDelete?: () => void;
}

export function ResultHeader({ title, timestamp, onSaveTitle, onDelete }: ResultHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Guards against a second commit (e.g. the blur that follows Enter) while one is in flight.
  const savingRef = useRef(false);

  // The draft is (re)seeded from the current title every time editing opens, so it never needs to
  // track the prop while the field is closed.
  function startEditing() {
    setDraft(title);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(title);
    setError(null);
    setEditing(false);
  }

  async function commit(via: 'enter' | 'blur') {
    if (!onSaveTitle || savingRef.current) {
      return;
    }
    const next = draft.trim();
    if (next === '') {
      // Enter on an empty field is an explicit mistake worth flagging; clicking away with nothing
      // typed just abandons the edit rather than trapping focus in an invalid field.
      if (via === 'blur') {
        cancelEditing();
        return;
      }
      setError('Please enter a title.');
      inputRef.current?.focus();
      return;
    }
    if (next === title) {
      cancelEditing();
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await onSaveTitle(next);
      setEditing(false);
      setError(null);
    } catch {
      setError('We couldn’t save the new title. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void commit('enter');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <Badge variant="success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Generated Successfully
          </Badge>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{timestamp}</span>
        </div>

        {editing ? (
          <>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              aria-label="Specification title"
              aria-invalid={error !== null}
              aria-describedby={error ? 'title-edit-error' : undefined}
              value={draft}
              disabled={saving}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => void commit('blur')}
              className="mt-3 w-full max-w-2xl rounded-lg border border-brand-300 dark:border-brand-500/60 bg-white dark:bg-slate-900 px-3 py-1.5 text-3xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
            />
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {saving ? 'Saving…' : 'Press Enter to save, Escape to cancel.'}
            </p>
          </>
        ) : (
          <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        )}

        {error && (
          <p id="title-edit-error" role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onSaveTitle ? (
          <button
            type="button"
            onClick={startEditing}
            disabled={editing}
            aria-label="Edit specification title"
            className={`${ICON_BUTTON} hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400 focus-visible:ring-brand-500`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
          >
            <Pencil className="h-4 w-4" />
          </span>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete specification"
            className={`${ICON_BUTTON} hover:border-red-300 dark:hover:border-red-500/50 hover:text-red-600 dark:hover:text-red-400 focus-visible:ring-red-500`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
