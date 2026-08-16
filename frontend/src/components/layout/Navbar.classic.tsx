import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';
import { Button } from '../ui';
import { useAuth } from '../../state/AuthContext';
import { useSpecification } from '../../state/SpecificationContext';
import { UserMenu } from './UserMenu';
import { ColorModeToggle } from './ColorModeToggle';
import { NAV_LINKS } from './navLinks';

// Classic (Tailwind) top navigation — the original navbar. Logo left, section links, an auth
// control, the primary "Get Started" CTA, and the light/dark toggle at the far right. The
// design-system switch is not here: it floats bottom-left (DesignSystemDock).

export function ClassicNavbar() {
  const { user, loading } = useAuth();
  const { dispatch } = useSpecification();

  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 bg-surface-muted/80 dark:bg-slate-950/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          aria-label="SpecPilot home"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <Rocket className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <span className="text-xl font-bold text-brand-700 dark:text-brand-300">SpecPilot</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
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
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Log in
              </Link>
            ))}

          {/* "Get Started" always begins a fresh spec, so clear any idea left over from a
              previously generated specification (unlike the CANCEL/"Generate Again" flows,
              which deliberately keep the idea). */}
          <Link
            to="/generate"
            aria-label="Get started — generate a specification"
            onClick={() => dispatch({ type: 'SET_IDEA', text: '' })}
          >
            <Button variant="primary">
              Get Started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>

          {/* Far right, and outside the auth-gated block: available signed in or out. */}
          <ColorModeToggle />
        </div>
      </nav>
    </header>
  );
}
