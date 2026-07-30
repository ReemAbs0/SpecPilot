import { Check, Loader2, Circle } from 'lucide-react';
import { cn } from '../ui';

// One row in the generation stage list (T027). Three visual states — done / active / pending —
// are conveyed by icon and text, not color alone; the active row carries aria-current="step"
// so assistive tech can locate the current stage (FR-018/FR-019).

export type StageStatus = 'done' | 'active' | 'pending';

export interface StageListItemProps {
  label: string;
  status: StageStatus;
}

export function StageListItem({ label, status }: StageListItemProps) {
  return (
    <li aria-current={status === 'active' ? 'step' : undefined} className="flex items-center gap-3">
      {status === 'done' && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      )}
      {status === 'active' && (
        <Loader2 className="h-5 w-5 animate-spin text-brand-600 dark:text-brand-400" aria-hidden="true" />
      )}
      {status === 'pending' && <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" aria-hidden="true" />}

      <span
        className={cn(
          'text-base',
          status === 'active' && 'font-medium text-brand-700 dark:text-brand-300',
          status === 'done' && 'text-slate-600 dark:text-slate-300',
          status === 'pending' && 'text-slate-400 dark:text-slate-500',
        )}
      >
        {label}
        {status === 'active' && '…'}
      </span>
    </li>
  );
}
