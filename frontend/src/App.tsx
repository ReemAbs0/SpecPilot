import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { SpecificationProvider } from './state/SpecificationContext';
import { Navbar } from './components/layout/Navbar';

// Route table across the four pages (T011). The real page components are implemented in
// their user-story phases (T025 Generator, T027 Generating, T028 Result, T034 Landing);
// until then each route renders a minimal placeholder so the routed app is runnable after
// the foundational phase (constitution Principle V).

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

function PagePlaceholder({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">This screen is implemented in a later phase.</p>
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
            <Route index element={<PagePlaceholder title="Landing" />} />
            <Route path="generate" element={<PagePlaceholder title="Generate Specification" />} />
            <Route
              path="generate/progress"
              element={<PagePlaceholder title="Generating your Specification…" />}
            />
            <Route path="result" element={<PagePlaceholder title="Generated Specification" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SpecificationProvider>
  );
}
