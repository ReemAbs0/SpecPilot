import { type ReactNode } from 'react';
import { Sparkles, FileText, ClipboardList, BookOpen, Map, Download } from 'lucide-react';
import { Card } from '../ui';

// Feature card + the six capabilities shown in the landing "Everything You Need" grid (T031).

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

const ICON = 'h-5 w-5';

export const FEATURES: Feature[] = [
  {
    icon: <Sparkles className={ICON} />,
    title: 'AI-Powered Generation',
    description: 'Generate complete software specifications using Fetch AI.',
  },
  {
    icon: <FileText className={ICON} />,
    title: 'Project Summary',
    description: 'Instantly create a clear project overview.',
  },
  {
    icon: <ClipboardList className={ICON} />,
    title: 'Requirements',
    description: 'Generate functional and non-functional requirements automatically.',
  },
  {
    icon: <BookOpen className={ICON} />,
    title: 'User Stories',
    description: 'Create structured user stories ready for development.',
  },
  {
    icon: <Map className={ICON} />,
    title: 'Milestones',
    description: 'Generate implementation phases and roadmap.',
  },
  {
    icon: <Download className={ICON} />,
    title: 'Markdown Export',
    description: 'Download your specification as a .md file.',
  },
];

export function FeatureCard({ icon, title, description }: Feature) {
  return (
    <Card>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </Card>
  );
}
