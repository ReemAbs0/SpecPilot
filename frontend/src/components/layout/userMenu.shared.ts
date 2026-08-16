import { useLocation, useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { useAuth } from '../../state/AuthContext';

// Shared logic for the profile menu, used by both the Classic and Material UserMenu renderers
// (feature/material-theme). Keeping the auth wiring here means the two themes render differently
// but behave identically — no authentication logic is duplicated.

/** Display name if set, otherwise the local part of the email (before "@"). */
export function menuLabel(user: User): string {
  const displayName = user.displayName?.trim();
  if (displayName) {
    return displayName;
  }
  const email = user.email ?? '';
  const at = email.indexOf('@');
  return at > 0 ? email.slice(0, at) : email || 'Account';
}

export interface UserMenuState {
  user: User | null;
  label: string;
  initial: string;
  /** True on the "My Specifications" section (/library and its detail pages). */
  onLibrary: boolean;
  /** Sign out and return to the landing page. */
  signOutAndGoHome: () => Promise<void>;
}

export function useUserMenu(): UserMenuState {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const label = user ? menuLabel(user) : '';
  const initial = label.charAt(0).toUpperCase();
  const onLibrary =
    location.pathname === '/library' || location.pathname.startsWith('/library/');

  async function signOutAndGoHome() {
    // Navigate home BEFORE signing out. If we sign out first, RequireAuth is still mounted on
    // the protected page when `user` flips to null, so it redirects to /login and records this
    // page in location.state.from — which would bounce the user back here on the next sign-in.
    // Going home first (replacing history so the private page isn't preserved) unmounts
    // RequireAuth, so no `from` is captured on an explicit logout. The normal guard redirect
    // (accessing a protected route while logged out) is unaffected.
    navigate('/', { replace: true });
    await signOut();
  }

  return { user, label, initial, onLibrary, signOutAndGoHome };
}
