import { CheckCircle2, Pencil } from 'lucide-react';
import { Badge } from '../ui';

// Result page header (T028): success status, timestamp, the specification title, and a
// decorative edit icon. The edit icon has no behavior in this version (it is aria-hidden and
// non-interactive) — the approved design shows it, but in-place editing is out of scope.

export interface ResultHeaderProps {
  title: string;
  timestamp: string;
}

export function ResultHeader({ title, timestamp }: ResultHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <Badge variant="success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Generated Successfully
          </Badge>
          <span className="text-sm font-medium text-slate-500">{timestamp}</span>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{title}</h1>
      </div>
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-400"
      >
        <Pencil className="h-4 w-4" />
      </span>
    </div>
  );
}
