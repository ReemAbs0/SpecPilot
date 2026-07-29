import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SavedSpecificationPage from '../src/pages/SavedSpecificationPage';
import { SpecificationProvider } from '../src/state/SpecificationContext';

// Phase 6: tests the saved-specification detail page — ready (renders reused result sections),
// not-found (404), and error (500). Auth is mocked and fetch is stubbed, so no live backend is
// needed. The reused ActionsPanel requires SpecificationProvider + a Router.

const authCtrl = vi.hoisted(() => ({
  user: { uid: 'u1', email: 'user@example.com', getIdToken: vi.fn(async () => 'id-token') },
}));

vi.mock('../src/state/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: authCtrl.user, loading: false }),
}));

const SPEC = {
  title: 'Habit Tracker Specification',
  projectSummary: 'A habit tracking application for daily routines.',
  targetUsers: 'People building better habits',
  userRoles: ['Member', 'Coach'],
  functionalRequirements: ['Create habits', 'Track streaks'],
  nonFunctionalRequirements: ['Fast load times'],
  userStories: [{ title: 'Track', narrative: 'As a Member, I want to log a habit', role: 'Member' }],
  milestones: [{ name: 'MVP', description: 'Core tracking', order: 1 }],
  technicalConsiderations: ['Offline-first storage'],
};

const SAVED = {
  id: 'spec-1',
  title: SPEC.title,
  idea: 'A habit tracking app for daily routines',
  specification: SPEC,
  createdAt: '2026-07-20T10:00:00.000Z',
};

function renderDetailAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/library/${id}`]}>
      <SpecificationProvider>
        <Routes>
          <Route path="/library/:id" element={<SavedSpecificationPage />} />
          <Route path="/library" element={<div>library list</div>} />
        </Routes>
      </SpecificationProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authCtrl.user.getIdToken.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SavedSpecificationPage', () => {
  it('renders the saved specification using the result sections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 200, json: async () => SAVED })),
    );

    renderDetailAt('spec-1');

    // Title + representative content from several reused sections.
    expect(await screen.findByText(SPEC.title)).toBeInTheDocument();
    expect(screen.getByText('Project Summary')).toBeInTheDocument();
    expect(screen.getByText('Technical Considerations')).toBeInTheDocument();
    expect(screen.getByText(SPEC.projectSummary)).toBeInTheDocument();
    expect(screen.getByText('Create habits')).toBeInTheDocument();
    expect(screen.getByText('Offline-first storage')).toBeInTheDocument();

    // Reused ActionsPanel is present, and the saved date shows in the header.
    expect(screen.getByRole('button', { name: /download markdown/i })).toBeInTheDocument();
    expect(screen.getByText(/saved/i)).toBeInTheDocument();

    // Requested the correct endpoint with the bearer token.
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/api/me/specifications/spec-1');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer id-token');
  });

  it('shows a not-found state on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 404, json: async () => ({ error: 'not_found' }) })),
    );

    renderDetailAt('missing');

    expect(await screen.findByText(/specification not found/i)).toBeInTheDocument();
    expect(screen.queryByText(SPEC.title)).not.toBeInTheDocument();
  });

  it('shows an error state on a server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ status: 500, json: async () => ({}) })),
    );

    renderDetailAt('spec-1');

    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
  });
});
