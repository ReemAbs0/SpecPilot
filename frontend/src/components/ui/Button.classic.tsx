import { forwardRef } from 'react';
import { cn } from './cn';
import type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

// Classic (Tailwind) button implementation — moved verbatim from the original Button.tsx so the
// Classic theme renders exactly as before. Variants match the filled/outline buttons seen across
// the approved Figma screens (nav CTA, hero, form actions). A visible focus-visible ring keeps
// it keyboard-operable (FR-018).

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ' +
  'focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
};

const sizes: Record<ButtonSize, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-base',
};

export const ClassicButton = forwardRef<HTMLButtonElement, ButtonProps>(function ClassicButton(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
});
