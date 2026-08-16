import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RequireAuth } from '../src/components/auth/RequireAuth';

// Phase 3: unit-tests the RequireAuth route guard in isolation by mocking the auth state, so no
// real Firebase project is needed. Covers the three states: loading, signed out, signed in.

const useAuthMock = vi.fn();
vi.mock('../src/state/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

function renderGuardedAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/library" element={<div>protected library</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthMock.mockReset();
});

describe('RequireAuth', () => {
  it('shows a neutral placeholder while auth is loading (no redirect)', () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    renderGuardedAt('/library');

    expect(screen.queryByText('protected library')).not.toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('redirects to /login when signed out', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    renderGuardedAt('/library');

    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected library')).not.toBeInTheDocument();
  });

  it('renders the protected route when signed in', () => {
    useAuthMock.mockReturnValue({ user: { uid: 'u1' }, loading: false });
    renderGuardedAt('/library');

    expect(screen.getByText('protected library')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
