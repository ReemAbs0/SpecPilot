import { useState, type FormEvent } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { Button, Card } from '../ui';

// Shared email/password form for the Login and Signup pages (feature/firebase-auth, Phase 2).
// Presentational: it owns only local field state + lightweight client validation, and hands
// the values to the page via `onSubmit`. The page performs the Firebase call and passes back
// `isSubmitting` / `submitError`.

export type AuthFormMode = 'login' | 'signup';

const COPY: Record<AuthFormMode, { title: string; subtitle: string; action: string }> = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to access your saved specifications.',
    action: 'Sign In',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Sign up to automatically save every specification you generate.',
    action: 'Create Account',
  },
};

// Firebase requires a minimum password length of 6.
const PASSWORD_MIN_LENGTH = 6;

export interface AuthFormProps {
  mode: AuthFormMode;
  onSubmit: (email: string, password: string) => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

export function AuthForm({ mode, onSubmit, isSubmitting, submitError }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);
  const copy = COPY[mode];
  const Icon = mode === 'login' ? LogIn : UserPlus;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (trimmedEmail === '') {
      setClientError('Please enter your email address.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      setClientError(`Password should be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    setClientError(null);
    onSubmit(trimmedEmail, password);
  }

  const error = clientError ?? submitError ?? null;

  return (
    <Card className="w-full max-w-md p-0">
      <div className="border-b border-slate-100 px-6 py-5">
        <h1 className="text-xl font-bold text-slate-900">{copy.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{copy.subtitle}</p>
      </div>

      <form className="flex flex-col gap-4 px-6 py-6" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={error ? true : undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'auth-error' : undefined}
            className="rounded-xl border border-slate-200 px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
          />
        </div>

        {error && (
          <p id="auth-error" role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? 'Please wait…' : copy.action}
        </Button>
      </form>
    </Card>
  );
}
