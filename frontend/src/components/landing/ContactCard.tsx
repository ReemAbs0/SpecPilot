import { Mail, Code2, User } from 'lucide-react';
import { Button, Card } from '../ui';

// "Get in Touch" card (T033). Contact links are placeholders for this version (no contact
// backend), consistent with the footer's placeholder links.

const CONTACTS = [
  { icon: <Mail className="h-4 w-4" aria-hidden="true" />, label: 'Email' },
  { icon: <Code2 className="h-4 w-4" aria-hidden="true" />, label: 'GitHub' },
  { icon: <User className="h-4 w-4" aria-hidden="true" />, label: 'LinkedIn' },
];

export function ContactCard() {
  return (
    <Card className="mx-auto max-w-2xl px-8 py-10 text-center">
      <h2 className="text-2xl font-bold text-slate-900">Get in Touch</h2>
      <p className="mx-auto mt-2 max-w-md text-slate-500">
        Have questions or need help? Our team is here to support your journey from idea to
        specification.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
        {CONTACTS.map((contact) => (
          <a
            key={contact.label}
            href="#"
            className="flex items-center gap-1.5 rounded-md text-sm text-slate-600 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {contact.icon}
            {contact.label}
          </a>
        ))}
      </div>
      <a href="#" className="mt-6 inline-block">
        <Button variant="primary">Contact Us</Button>
      </a>
    </Card>
  );
}
