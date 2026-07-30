import { Loader2 } from 'lucide-react';
import { cn } from './cn';
import type { SpinnerProps } from './Spinner';

// Classic (Tailwind) loading indicator — moved verbatim from the original Spinner.tsx. A small
// spinning icon plus an accessible label, used across the auth/library loading states.

export function ClassicSpinner({ label, className }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-slate-500', className)} role="status">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className={label ? undefined : 'sr-only'}>{label ?? 'Loading'}</span>
    </span>
  );
}
