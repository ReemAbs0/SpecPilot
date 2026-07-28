import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext';

// Route guard for authenticated-only pages (feature/firebase-auth, Phase 3). Used as a layout
// route wrapping the protected routes (e.g. /library in Phase 5); it renders the matched child
// route via <Outlet /> only when a user is signed in.
//
// Two important behaviors:
//  - While auth state is still resolving (`loading`), it renders a neutral placeholder rather
//    than redirecting, so a signed-in user with a restored session is never briefly bounced to
//    /login on first paint.
//  - When signed out, it redirects to /login and records the attempted path in
//    location.state.from, so the login page can send the user back after a successful sign-in.

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-busy="true">
        <p className="text-slate-500">Loading…</p>
      </section>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
