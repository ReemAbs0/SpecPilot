import { Link, useNavigate } from 'react-router-dom';
import { Rocket, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../state/AuthContext';

// Shared top navigation (T014), present on every page. Logo left, section links, and a
// primary "Get Started" CTA that routes to the generator. Matches the approved design. The
// auth controls (feature/firebase-auth, Phase 2) show Log in / Sign up when signed out, and
// the user's email + Sign out when signed in.

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Contact', href: '/#contact' },
];

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-surface-muted/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          aria-label="SpecPilot home"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <Rocket className="h-6 w-6 text-brand-600" aria-hidden="true" />
          <span className="text-xl font-bold text-brand-700">SpecPilot</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {/* While the first auth-state resolution is pending, render no auth control to avoid
              a signed-out → signed-in flash. */}
          {!loading &&
            (user ? (
              <>
                <Link
                  to="/library"
                  className="hidden rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:inline"
                >
                  My Specifications
                </Link>
                <span
                  className="hidden max-w-[16ch] truncate text-sm font-medium text-slate-600 sm:inline"
                  title={user.email ?? undefined}
                >
                  {user.email}
                </span>
                <Button variant="secondary" onClick={handleSignOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Log in
              </Link>
            ))}

          <Link to="/generate" aria-label="Get started — generate a specification">
            <Button variant="primary">
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
