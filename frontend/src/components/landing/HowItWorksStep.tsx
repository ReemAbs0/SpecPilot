import { type ReactNode } from 'react';
import { PenLine, LayoutGrid, Sparkles, Rocket } from 'lucide-react';

// "How SpecPilot Works" step + the four-step sequence shown on the landing page (T032).

export interface Step {
  icon: ReactNode;
  label: string;
  caption: string;
}

const ICON = 'h-5 w-5';

export const STEPS: Step[] = [
  { icon: <PenLine className={ICON} />, label: 'Step 1', caption: 'Describe your software idea.' },
  {
    icon: <LayoutGrid className={ICON} />,
    label: 'Step 2',
    caption: 'Fetch AI analyzes your project.',
  },
  {
    icon: <Sparkles className={ICON} />,
    label: 'Step 3',
    caption: 'Generate a complete specification.',
  },
  { icon: <Rocket className={ICON} />, label: 'Step 4', caption: 'Export and start building.' },
];

export function HowItWorksStep({ icon, label, caption }: Step) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{caption}</p>
    </div>
  );
}
