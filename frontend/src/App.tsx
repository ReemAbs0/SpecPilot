import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { SpecificationProvider } from './state/SpecificationContext';
import { Navbar } from './components/layout/Navbar';
import { Button } from './components/ui';
import GeneratorPage from './pages/GeneratorPage';
import GeneratingPage from './pages/GeneratingPage';
import ResultPage from './pages/ResultPage';

// Route table across the four pages (T011, wired in T029). The Landing page ("/") is
// implemented in User Story 2; until then the root shows a lightweight entry point into the
// generator so the idea-to-specification flow (User Story 1) is reachable.

function AppLayout() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
    </>
  );
}

function LandingPlaceholder() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Turn your software idea into a complete specification
      </h1>
      <p className="mt-3 max-w-xl text-slate-500">
        Describe your idea in plain English and let SpecPilot generate a structured software
        specification.
      </p>
      <Link to="/generate" className="mt-6 inline-block">
        <Button variant="primary" size="lg">
          Generate Specification
        </Button>
      </Link>
    </section>
  );
}

function NotFound() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-2 inline-block text-brand-600 hover:text-brand-700">
        Go back home
      </Link>
    </section>
  );
}

export default function App() {
  return (
    <SpecificationProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<LandingPlaceholder />} />
            <Route path="generate" element={<GeneratorPage />} />
            <Route path="generate/progress" element={<GeneratingPage />} />
            <Route path="result" element={<ResultPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SpecificationProvider>
  );
}
