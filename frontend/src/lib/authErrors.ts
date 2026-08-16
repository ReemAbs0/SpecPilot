// Maps Firebase Auth error codes to short, user-facing messages (feature/firebase-auth,
// Phase 2). Firebase throws errors whose `.code` looks like 'auth/invalid-credential'; we
// never surface raw codes to users. Unknown codes fall back to a generic message.

const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/missing-password': 'Please enter your password.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection.',
};

const FALLBACK = 'Something went wrong. Please try again.';

/** Extracts a friendly message from an unknown thrown auth error. */
export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  return MESSAGES[code] ?? FALLBACK;
}
