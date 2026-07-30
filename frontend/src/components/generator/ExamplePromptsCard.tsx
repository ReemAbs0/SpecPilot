import { Bot } from 'lucide-react';
import { Card, Surface } from '../ui';

// Example prompts sidebar card (T024). Clicking an example prefills the idea textarea via
// the onSelect callback so users can start from a worked example.

interface ExamplePrompt {
  title: string;
  preview: string;
  prompt: string;
}

const EXAMPLES: ExamplePrompt[] = [
  {
    title: 'E-commerce Marketplace',
    preview: 'A multi-vendor platform with cart, checkout, vendor...',
    prompt:
      'A multi-vendor e-commerce marketplace where independent vendors list products and ' +
      'buyers browse, add to cart, and check out. It needs vendor storefronts, product search ' +
      'and filtering, a shopping cart, secure checkout with card payments, order tracking, and ' +
      'separate dashboards for buyers, vendors, and administrators.',
  },
  {
    title: 'Internal CRM Tool',
    preview: 'Lead tracking system with email integration, custom reporting,...',
    prompt:
      'An internal CRM tool for a sales team to track leads through a pipeline. It needs contact ' +
      'and company records, lead stages, activity logging, email integration, task reminders, ' +
      'custom reporting dashboards, and role-based access for sales reps and managers.',
  },
];

export interface ExamplePromptsCardProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function ExamplePromptsCard({ onSelect, disabled }: ExamplePromptsCardProps) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-slate-900">Example Prompts</h2>
      </div>
      <div className="mt-4 space-y-3">
        {EXAMPLES.map((example) => (
          <Surface
            as="button"
            key={example.title}
            type="button"
            onClick={() => onSelect(example.prompt)}
            disabled={disabled}
            elevation={1}
            surface="rounded-xl border border-slate-200"
            className="w-full p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
          >
            <p className="text-sm font-semibold text-slate-900">{example.title}</p>
            <p className="mt-1 text-sm text-slate-500">{example.preview}</p>
          </Surface>
        ))}
      </div>
    </Card>
  );
}
