import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';

// Shared footer (T014). Rendered on the landing page per the approved design. Grouped link
// columns match the Figma footer; hrefs point at landing-page section anchors.

const columns = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Features', href: '/#features' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'GitHub', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
  {
    heading: 'Social',
    links: [
      { label: 'GitHub', href: '#' },
      { label: 'LinkedIn', href: '#' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-surface-muted">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" aria-label="SpecPilot home" className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <span className="text-lg font-bold text-brand-700">SpecPilot</span>
            </Link>
            <p className="mt-2 text-sm text-slate-500">Built with Fetch AI.</p>
          </div>

          {columns.map((column) => (
            <div key={column.heading}>
              <h2 className="text-sm font-semibold text-slate-900">{column.heading}</h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="rounded-md text-sm text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-400">© 2026 SpecPilot. Built with Fetch AI.</p>
      </div>
    </footer>
  );
}
