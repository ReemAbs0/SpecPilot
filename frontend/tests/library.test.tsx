import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LibraryPage from '../src/pages/LibraryPage';

// Phase 5: tests the Library list — newest-first ordering, openable links, empty state, and
// error state. Auth is mocked (the route is guarded in the app), and fetch is stubbed so no
// real Firebase/backend is needed.

const authCtrl = vi.hoisted(() => ({
  user: { uid: 'u1', email: 'user@example.com', getIdToken: vi.fn(async () => 'id-token') },
}));

vi.mock('../src/state/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: authCtrl.user, loading: false }),
}));

function renderLibrary() {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <LibraryPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authCtrl.user.getIdToken.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LibraryPage', () => {
  it('lists saved specifications newest-first, each linking to its detail route', async () => {
    // Returned out of order on purpose to prove the page sorts newest-first.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        status: 200,
        json: async () => ({
          specifications: [
            { id: 'older', title: 'Older Spec', idea: 'an older idea', createdAt: '2026-07-01T10:00:00.000Z' },
            { id: 'newer', title: 'Newer Spec', idea: 'a newer idea', createdAt: '2026-07-20T10:00:00.000Z' },
          ],
        }),
      })),
    );

    renderLibrary();

    // Both items render.
    const newer = await screen.findByText('Newer Spec');
    expect(newer).toBeInTheDocument();
    expect(screen.getByText('Older Spec')).toBeInTheDocument();

    // Newest-first: 'Newer Spec' appears before 'Older Spec' in document order.
    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('Newer Spec')).toBeInTheDocument();
    expect(within(items[1]).getByText('Older Spec')).toBeInTheDocument();

    // Each card is a link to /library/:id (opening a saved specification).
    const links = screen.getAllByRole('link');
    const hrefs = links.map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/library/newer');
    expect(hrefs).toContain('/library/older');

    // The request carried the user's bearer token.
    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const [url, init] = calls[0];
    expect(url).toBe('/api/me/specifications');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer id-token');
  });

  it('shows an empty state when there are no saved specifications', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 200, json: async () => ({ specifications: [] }) })),
    );

    renderLibrary();

    expect(await screen.findByText(/no specifications yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /generate a specification/i })).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 500, json: async () => ({}) })),
    );

    renderLibrary();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t load/i);
  });
});
