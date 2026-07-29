import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { AuthForm } from '../components/auth/AuthForm';
import { authErrorMessage } from '../lib/authErrors';

// Sign-in page (feature/firebase-auth, Phase 2). On success it returns the user to wherever a
// route guard sent them from (RequireAuth sets location.state.from in Phase 3), defaulting home.

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  // Already signed in — no reason to show the form.
  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 sm:px-6">
      <AuthForm
        mode="login"
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitError={error}
      />
      <p className="mt-6 text-sm text-slate-500">
        Don’t have an account?{' '}
        <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-700">
          Create one
        </Link>
      </p>
    </div>
  );
}
