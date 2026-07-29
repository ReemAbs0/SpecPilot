import { Loader2 } from 'lucide-react';
import { cn } from './cn';

// Shared loading indicator (feature/firebase-auth, Phase 7). A small spinning icon plus an
// accessible label, used across the auth/library loading states for a consistent look. Pass
// `label` to show text next to the spinner; otherwise it is available only to screen readers.

export interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner({ label, className }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-slate-500', className)} role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className={label ? undefined : 'sr-only'}>{label ?? 'Loading'}</span>
    </span>
  );
}
