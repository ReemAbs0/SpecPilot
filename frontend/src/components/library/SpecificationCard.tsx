import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import { Surface } from '../ui';
import type { SavedSpecificationSummary } from '../../types/savedSpecification.types';

// A single saved-specification entry in the Library list (feature/firebase-auth, Phase 5). The
// whole card is a link that opens the specification at /library/:id (the detail page lands in
// Phase 6). Presentational: it receives one summary and renders it.

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

export function SpecificationCard({ spec }: { spec: SavedSpecificationSummary }) {
  const created = formatCreatedAt(spec.createdAt);

  return (
    <Surface
      as={Link}
      to={`/library/${spec.id}`}
      surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
      className="group flex items-center gap-4 p-5 transition-colors hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
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

      <ChevronRight
        className="h-5 w-5 shrink-0 text-slate-300 dark:text-slate-600 transition-colors group-hover:text-brand-500"
        aria-hidden="true"
      />
    </Surface>
  );
}
