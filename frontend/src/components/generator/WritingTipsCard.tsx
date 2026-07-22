import { Lightbulb, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui';

// Writing tips sidebar card (T024). Static guidance matching the approved generator design.

const TIPS = [
  'Define the primary user roles (e.g., Admin, Customer).',
  'List key features and desired outcomes clearly.',
  'Mention any specific integrations or platforms (iOS, Web).',
];

export function WritingTipsCard() {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">Writing Tips</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2 text-sm text-slate-600">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
