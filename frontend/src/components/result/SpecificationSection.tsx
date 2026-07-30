import { type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Surface } from '../ui';

// A collapsible specification section card (T028), matching the accordion cards in the
// approved result design. Built on a native <details> element so it is keyboard-accessible
// and toggleable without extra JS (FR-018).

export interface SpecificationSectionProps {
  icon: ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function SpecificationSection({
  icon,
  title,
  defaultOpen = false,
  children,
}: SpecificationSectionProps) {
  return (
    <Surface
      as="details"
      open={defaultOpen}
      surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
      className="group"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          <span className="text-brand-600 dark:text-brand-400" aria-hidden="true">
            {icon}
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        </span>
        <ChevronDown
          className="h-5 w-5 text-slate-400 dark:text-slate-500 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5">{children}</div>
    </Surface>
  );
}
