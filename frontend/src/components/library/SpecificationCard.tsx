import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Trash2 } from 'lucide-react';
import { Surface } from '../ui';
import type { SavedSpecificationSummary } from '../../types/savedSpecification.types';

// A single saved-specification entry in the Library list (feature/firebase-auth, Phase 5). The
// card opens the specification at /library/:id and — when the page passes `onDelete` — offers a
// delete action. Presentational: it receives one summary and reports the delete intent upward;
// the confirmation prompt and the actual removal belong to the page.
//
// Layout note: a button cannot live inside an <a>, so the card body is a plain surface with a
// stretched overlay Link covering it. The link is absolutely positioned, so it paints above the
// static content (the whole card stays clickable) while the delete button, lifted with z-10,
// stays clickable on top of it.

/** Formats an ISO timestamp for display; falls back gracefully when it is null/unparseable. */
function formatCreatedAt(createdAt: string | null): string {
  if (!createdAt) {
    return 'Just now';
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export interface SpecificationCardProps {
  spec: SavedSpecificationSummary;
  /** Asks the page to delete this specification. Omit to render the card without a delete action. */
  onDelete?: (spec: SavedSpecificationSummary) => void;
}

export function SpecificationCard({ spec, onDelete }: SpecificationCardProps) {
  const created = formatCreatedAt(spec.createdAt);

  return (
    <Surface
      surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
      className="group relative flex items-center gap-4 p-5 transition-colors hover:border-brand-200 focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2"
    >
      <Link
        to={`/library/${spec.id}`}
        className="absolute inset-0 rounded-2xl focus:outline-none"
        aria-label={`Open ${spec.title}`}
      />

      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <FileText className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="truncate font-semibold text-slate-900 dark:text-slate-100">{spec.title}</h2>
          {created && <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{created}</span>}
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{spec.idea}</p>
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(spec)}
          aria-label={`Delete ${spec.title}`}
          className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <ChevronRight
        className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-brand-500"
        aria-hidden="true"
      />
    </Surface>
  );
}
