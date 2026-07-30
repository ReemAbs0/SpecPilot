import { Hero } from '../components/landing/Hero';
import { FeatureCard, FEATURES } from '../components/landing/FeatureCard';
import { HowItWorksStep, STEPS } from '../components/landing/HowItWorksStep';
import { ContactCard } from '../components/landing/ContactCard';
import { CtaBanner } from '../components/landing/CtaBanner';
import { Footer } from '../components/layout/Footer';

// Landing page (T034). Composes the hero, feature grid, how-it-works sequence, contact card,
// and CTA banner. Section ids match the navbar/footer anchor links (#features, #how-it-works,
// #contact). The Footer appears on the landing page only, per the design.

export default function LandingPage() {
  return (
    <>
      <Hero />

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Everything You Need to Plan Better Software
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-surface-lavender dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">How SpecPilot Works</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <HowItWorksStep key={step.label} {...step} />
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <ContactCard />
      </section>

      <CtaBanner />
      <Footer />
    </>
  );
}
