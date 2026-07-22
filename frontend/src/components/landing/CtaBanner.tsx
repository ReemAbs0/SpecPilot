import { Link } from 'react-router-dom';
import { Button } from '../ui';

// Full-width call-to-action banner (T033), matching the indigo band near the foot of the
// landing page. The white "Get Started" button routes into the generator.

export function CtaBanner() {
  return (
    <section className="bg-brand-700">
      <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to Build Your Next Software Project?
        </h2>
        <p className="mt-3 text-brand-100">
          Generate your first professional specification in seconds with Fetch AI.
        </p>
        <Link to="/generate" className="mt-8 inline-block">
          <Button variant="secondary" size="lg">
            Get Started
          </Button>
        </Link>
      </div>
    </section>
  );
}
