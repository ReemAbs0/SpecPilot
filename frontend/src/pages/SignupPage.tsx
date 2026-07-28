import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { AuthForm } from '../components/auth/AuthForm';
import { authErrorMessage } from '../lib/authErrors';

// Sign-up page (feature/firebase-auth, Phase 2). Creating an account also signs the user in
// (Firebase), so on success we route to wherever they were headed (default home).

export default function SignupPage() {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setSubmitting(true);
    try {
      await signUp(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 sm:px-6">
      <AuthForm
        mode="signup"
        onSubmit={handleSubmit}
        isSubmitting={submitting}
        submitError={error}
      />
      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
