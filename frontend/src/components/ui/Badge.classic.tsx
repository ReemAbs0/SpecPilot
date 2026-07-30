import { type HTMLAttributes } from 'react';
import { cn } from './cn';
import type { BadgeVariant } from './Badge';

// Classic (Tailwind) badge/pill — moved verbatim from the original Badge.tsx. Matches the
// "AI Powered" and "Generated Successfully" pills in the approved designs.

const variants: Record<BadgeVariant, string> = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-brand-50 text-brand-700',
  neutral: 'bg-slate-100 text-slate-600',
};

export interface ClassicBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function ClassicBadge({ variant = 'brand', className, ...props }: ClassicBadgeProps) {
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
