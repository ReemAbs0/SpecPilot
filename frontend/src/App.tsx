import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './state/AuthContext';
import { SpecificationProvider } from './state/SpecificationContext';
import { Navbar } from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import GeneratorPage from './pages/GeneratorPage';
import GeneratingPage from './pages/GeneratingPage';
import ResultPage from './pages/ResultPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LibraryPage from './pages/LibraryPage';
import { RequireAuth } from './components/auth/RequireAuth';

// Route table across the pages (T011, wired in T029; Landing added in T034). The /library
// routes are protected by RequireAuth (feature/firebase-auth, Phase 3). /library is the saved-
// specifications list (Phase 5); /library/:id opens one saved specification — its detail page
// arrives in Phase 6, so for now it routes to a placeholder.

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

// Placeholder for the protected saved-specification detail route. Replaced by the real
// SavedSpecificationPage in Phase 6 — for now it confirms navigation from a library card works.
function SavedSpecificationPlaceholder() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Saved specification</h1>
      <p className="mt-2 text-slate-500">This specification will open here soon.</p>
      <Link to="/library" className="mt-4 inline-block text-brand-600 hover:text-brand-700">
        Back to My Specifications
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
    <AuthProvider>
      <SpecificationProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="generate" element={<GeneratorPage />} />
              <Route path="generate/progress" element={<GeneratingPage />} />
              <Route path="result" element={<ResultPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route element={<RequireAuth />}>
                <Route path="library" element={<LibraryPage />} />
                <Route path="library/:id" element={<SavedSpecificationPlaceholder />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SpecificationProvider>
    </AuthProvider>
  );
}
