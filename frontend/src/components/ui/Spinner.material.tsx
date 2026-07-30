import CircularProgress from '@mui/material/CircularProgress';
import { cn } from './cn';
import type { SpinnerProps } from './Spinner';

// Material (MUI) loading indicator. Uses MUI's <CircularProgress> with the same accessible
// label contract as the Classic spinner (visible text when `label` is set, otherwise an
// sr-only "Loading" for screen readers).

export function MaterialSpinner({ label, className }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-slate-500', className)} role="status">
      <CircularProgress size={16} thickness={5} aria-hidden="true" />
      <span className={label ? undefined : 'sr-only'}>{label ?? 'Loading'}</span>
    </span>
  );
}
