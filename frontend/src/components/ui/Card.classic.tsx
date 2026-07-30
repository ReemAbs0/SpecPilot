import { type HTMLAttributes } from 'react';
import { cn } from './cn';

// Classic (Tailwind) card surface — moved verbatim from the original Card.tsx. Rounded corners +
// soft shadow per the design system (plan.md). Used by feature cards, tip cards, the progress
// card, result sections, and the auth card.

export function ClassicCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-card',
        className,
      )}
      {...props}
    />
  );
}
