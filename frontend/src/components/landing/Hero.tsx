import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button, Surface } from '../ui';

// Landing hero (T030). Headline, subtext, primary/secondary CTAs, and a decorative browser
// mockup — matching the approved landing design. Reuses the shared Button primitive.

function HeroMockup() {
  return (
    <Surface
      aria-hidden="true"
      elevation={6}
      surface="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card"
      className="mx-auto mt-4 max-w-4xl overflow-hidden"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="grid grid-cols-[160px_1fr] gap-6 p-6">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded bg-brand-100 dark:bg-brand-500/20" />
          <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800" />
          <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="space-y-4">
          <div className="flex h-9 items-center rounded-lg bg-brand-50 dark:bg-brand-500/10 px-3">
            <div className="h-2.5 w-40 rounded bg-brand-100 dark:bg-brand-500/20" />
          </div>
          <div className="space-y-2 rounded-lg bg-surface-muted dark:bg-slate-950 p-4">
            <div className="h-3 w-full rounded bg-brand-100/70 dark:bg-brand-500/20" />
            <div className="h-3 w-11/12 rounded bg-slate-100 dark:bg-slate-800" />
            <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </Surface>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-20 text-center sm:px-6">
        {/* Soft glow behind the call-to-action, per the design. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-40 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-300/30 blur-3xl"
        />
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          Turn Your Software Idea into a{' '}
          <span className="text-brand-600 dark:text-brand-400">Complete Specification</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-slate-500 dark:text-slate-400">
          Describe your idea in plain English and let Fetch AI generate a production-ready software
          specification. Stop wrestling with blank documents and start building faster.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/generate">
            <Button variant="primary" size="lg">
              Generate Specification
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
          <a href="#features">
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </a>
        </div>
      </div>
      <div className="px-4 pb-8 sm:px-6">
        <HeroMockup />
      </div>
    </section>
  );
}
