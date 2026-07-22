import { type HTMLAttributes } from 'react';
import { cn } from './cn';

// Shared card surface primitive (T013). The base surface used by feature cards, tip cards,
// the progress card, and result sections — rounded corners + soft shadow per the design
// system (plan.md).

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-100 bg-white p-6 shadow-card', className)}
      {...props}
    />
  );
}
