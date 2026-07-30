import { type ReactNode } from 'react';
import { Mail, Code2, User } from 'lucide-react';
import { Button, Card } from '../ui';

// "Get in Touch" card (T033). Each contact link performs a real action rather than jumping to
// the top of the page. Replace CONTACT_EMAIL and the social URLs with the team's real details.
const CONTACT_EMAIL = 'hello@specpilot.app';

interface Contact {
  icon: ReactNode;
  label: string;
  href: string;
  external?: boolean;
}

const CONTACTS: Contact[] = [
  {
    icon: <Mail className="h-4 w-4" aria-hidden="true" />,
    label: 'Email',
    href: `mailto:${CONTACT_EMAIL}`,
  },
  {
    icon: <Code2 className="h-4 w-4" aria-hidden="true" />,
    label: 'GitHub',
    href: 'https://github.com',
    external: true,
  },
  {
    icon: <User className="h-4 w-4" aria-hidden="true" />,
    label: 'LinkedIn',
    href: 'https://www.linkedin.com',
    external: true,
  },
];

export function ContactCard() {
  return (
    <Card className="mx-auto max-w-2xl px-8 py-10 text-center">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Get in Touch</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-500 dark:text-slate-400">
        Have questions or need help? Our team is here to support your journey from idea to
        specification.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
        {CONTACTS.map((contact) => (
          <a
            key={contact.label}
            href={contact.href}
            {...(contact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="flex items-center gap-1.5 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {contact.icon}
            {contact.label}
          </a>
        ))}
      </div>
      <a href={`mailto:${CONTACT_EMAIL}?subject=SpecPilot%20inquiry`} className="mt-6 inline-block">
        <Button variant="primary">Contact Us</Button>
      </a>
    </Card>
  );
}
