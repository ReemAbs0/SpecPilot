import { type HTMLAttributes } from 'react';
import { cn } from './cn';

// Shared badge/pill primitive (T013). Matches the "AI Powered" and "Generated Successfully"
// pills in the approved designs.

export type BadgeVariant = 'brand' | 'success' | 'neutral';

const variants: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-brand-50 text-brand-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = 'brand', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
