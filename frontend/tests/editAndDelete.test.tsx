import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useEffect, useState, type ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SavedSpecificationPage from '../src/pages/SavedSpecificationPage';
import LibraryPage from '../src/pages/LibraryPage';
import ResultPage from '../src/pages/ResultPage';
import { SpecificationProvider, useSpecification } from '../src/state/SpecificationContext';

// Renaming a specification's title in place (PATCH /api/me/specifications/:id) and deleting a
// saved specification (DELETE /api/me/specifications/:id). Auth is mocked and fetch is stubbed
// per HTTP method, so no live backend or Firebase project is needed.

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
  userStories: [
    { title: 'Track', narrative: 'As a Member, I want to log a habit', role: 'Member' },
  ],
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

const SUMMARIES = [
  { id: 'newer', title: 'Newer Spec', idea: 'a newer idea', createdAt: '2026-07-20T10:00:00.000Z' },
  { id: 'older', title: 'Older Spec', idea: 'an older idea', createdAt: '2026-07-01T10:00:00.000Z' },
];

type FetchCall = [string, RequestInit | undefined];

/** fetch stub routing by method: GETs serve the fixtures, mutations use `mutation`. */
function stubFetch(mutation: { status: number }) {
  const mock = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    if (method === 'GET') {
      return url === '/api/me/specifications'
        ? { status: 200, json: async () => ({ specifications: SUMMARIES }) }
        : { status: 200, json: async () => SAVED };
    }
    return { status: mutation.status, json: async () => ({}) };
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

function calls(): FetchCall[] {
  return (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls as FetchCall[];
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/library/spec-1']}>
      <SpecificationProvider>
        <Routes>
          <Route path="/library/:id" element={<SavedSpecificationPage />} />
          <Route path="/library" element={<div>library list</div>} />
        </Routes>
      </SpecificationProvider>
    </MemoryRouter>,
  );
}

function renderLibrary() {
  return render(
    <MemoryRouter initialEntries={['/library']}>
      <LibraryPage />
    </MemoryRouter>,
  );
}

/**
 * Seeds the generation context with a successful, already-persisted run before mounting the
 * routes, so ResultPage's "not success → redirect" guard doesn't fire during setup. Once the
 * routes are up they stay mounted (as in the real app) even if the result is later cleared.
 */
function SeededResult({ savedId, children }: { savedId?: string; children: ReactNode }) {
  const { state, dispatch } = useSpecification();
  const [seeded, setSeeded] = useState(false);
  if (state.status === 'success' && !seeded) {
    setSeeded(true);
  }
  useEffect(() => {
    dispatch({ type: 'SUCCEEDED', specification: SPEC });
    if (savedId) {
      dispatch({ type: 'SAVED', id: savedId });
    }
  }, [dispatch, savedId]);
  return seeded ? <>{children}</> : null;
}

function renderResult(savedId?: string) {
  return render(
    <MemoryRouter initialEntries={['/result']}>
      <SpecificationProvider>
        <SeededResult savedId={savedId}>
          <Routes>
            <Route path="/result" element={<ResultPage />} />
            <Route path="/generate" element={<div>generator</div>} />
            <Route path="/library" element={<div>library list</div>} />
          </Routes>
        </SeededResult>
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

describe('renaming a saved specification', () => {
  it('saves the edited title to Firestore on Enter and updates the page immediately', async () => {
    stubFetch({ status: 200 });
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(SPEC.title);
    await user.click(screen.getByRole('button', { name: /edit specification title/i }));

    const input = screen.getByRole('textbox', { name: /specification title/i });
    expect(input).toHaveValue(SPEC.title);
    await user.clear(input);
    await user.type(input, 'Renamed Habit Tracker{Enter}');

    // Persisted with the bearer token…
    await waitFor(() => {
      const patch = calls().find(([, init]) => init?.method === 'PATCH');
      expect(patch).toBeDefined();
      const [url, init] = patch!;
      expect(url).toBe('/api/me/specifications/spec-1');
      expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer id-token');
      expect(JSON.parse(init!.body as string)).toEqual({ title: 'Renamed Habit Tracker' });
    });

    // …and reflected on screen without a reload.
    expect(await screen.findByRole('heading', { name: 'Renamed Habit Tracker' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /specification title/i })).not.toBeInTheDocument();
  });

  it('saves when the user clicks outside the field', async () => {
    stubFetch({ status: 200 });
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(SPEC.title);
    await user.click(screen.getByRole('button', { name: /edit specification title/i }));
    const input = screen.getByRole('textbox', { name: /specification title/i });
    await user.clear(input);
    await user.type(input, 'Blur Saved Title');
    await user.click(screen.getByText('Project Summary'));

    await waitFor(() => {
      const patch = calls().find(([, init]) => init?.method === 'PATCH');
      expect(JSON.parse((patch![1]!.body as string) ?? '{}')).toEqual({ title: 'Blur Saved Title' });
    });
    expect(await screen.findByRole('heading', { name: 'Blur Saved Title' })).toBeInTheDocument();
  });

  it('rejects an empty title without calling the API', async () => {
    stubFetch({ status: 200 });
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(SPEC.title);
    await user.click(screen.getByRole('button', { name: /edit specification title/i }));
    const input = screen.getByRole('textbox', { name: /specification title/i });
    await user.clear(input);
    await user.type(input, '   {Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a title/i);
    expect(calls().some(([, init]) => init?.method === 'PATCH')).toBe(false);
  });

  it('shows a friendly error and keeps the old title when saving fails', async () => {
    stubFetch({ status: 500 });
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(SPEC.title);
    await user.click(screen.getByRole('button', { name: /edit specification title/i }));
    const input = screen.getByRole('textbox', { name: /specification title/i });
    await user.clear(input);
    await user.type(input, 'Will Not Save{Enter}');

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t save the new title/i);
    // The edit stays open with the user's text, and the stored title is unchanged.
    expect(screen.getByRole('textbox', { name: /specification title/i })).toHaveValue(
      'Will Not Save',
    );
    expect(screen.queryByRole('heading', { name: 'Will Not Save' })).not.toBeInTheDocument();
  });
});

describe('renaming from the result page', () => {
  it('persists the new title when the run was saved to the account', async () => {
    stubFetch({ status: 200 });
    const user = userEvent.setup();
    renderResult('saved-1');

    await screen.findByRole('heading', { name: SPEC.title });
    await user.click(screen.getByRole('button', { name: /edit specification title/i }));
    const input = screen.getByRole('textbox', { name: /specification title/i });
    await user.clear(input);
    await user.type(input, 'Result Page Rename{Enter}');

    await waitFor(() => {
      const patch = calls().find(([, init]) => init?.method === 'PATCH');
      expect(patch![0]).toBe('/api/me/specifications/saved-1');
      expect(JSON.parse(patch![1]!.body as string)).toEqual({ title: 'Result Page Rename' });
    });
    expect(await screen.findByRole('heading', { name: 'Result Page Rename' })).toBeInTheDocument();
  });

  it('renames locally without any request when the run was never saved', async () => {
    stubFetch({ status: 200 });
    const user = userEvent.setup();
    renderResult();

    await screen.findByRole('heading', { name: SPEC.title });
    await user.click(screen.getByRole('button', { name: /edit specification title/i }));
    const input = screen.getByRole('textbox', { name: /specification title/i });
    await user.clear(input);
    await user.type(input, 'Local Only Rename{Enter}');

    expect(await screen.findByRole('heading', { name: 'Local Only Rename' })).toBeInTheDocument();
    expect(calls().some(([, init]) => init?.method === 'PATCH')).toBe(false);
  });
});

describe('deleting a saved specification', () => {
  it('asks for confirmation, deletes it, and removes it from the list', async () => {
    stubFetch({ status: 204 });
    const user = userEvent.setup();
    renderLibrary();

    await screen.findByText('Older Spec');
    await user.click(screen.getByRole('button', { name: /delete older spec/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/delete specification\?/i)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      const del = calls().find(([, init]) => init?.method === 'DELETE');
      expect(del).toBeDefined();
      const [url, init] = del!;
      expect(url).toBe('/api/me/specifications/older');
      expect((init!.headers as Record<string, string>).Authorization).toBe('Bearer id-token');
    });

    // Gone from the list, and the remaining specification is untouched.
    await waitFor(() => expect(screen.queryByText('Older Spec')).not.toBeInTheDocument());
    expect(screen.getByText('Newer Spec')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('cancelling the confirmation deletes nothing', async () => {
    stubFetch({ status: 204 });
    const user = userEvent.setup();
    renderLibrary();

    await screen.findByText('Older Spec');
    await user.click(screen.getByRole('button', { name: /delete older spec/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByText('Older Spec')).toBeInTheDocument();
    expect(calls().some(([, init]) => init?.method === 'DELETE')).toBe(false);
  });

  it('keeps the specification and explains the failure when deleting fails', async () => {
    stubFetch({ status: 500 });
    const user = userEvent.setup();
    renderLibrary();

    await screen.findByText('Older Spec');
    await user.click(screen.getByRole('button', { name: /delete older spec/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/couldn’t delete/i);
    expect(screen.getByText('Older Spec')).toBeInTheDocument();
  });
});

describe('deleting from the result page', () => {
  it('offers delete beside edit once the run has been saved, then returns to the library', async () => {
    stubFetch({ status: 204 });
    const user = userEvent.setup();
    renderResult('saved-1');

    await screen.findByRole('heading', { name: SPEC.title });
    // Both icon actions sit in the header's icon group.
    expect(screen.getByRole('button', { name: /edit specification title/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /delete specification/i }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(new RegExp(SPEC.title))).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    const del = await waitFor(() => {
      const call = calls().find(([, init]) => init?.method === 'DELETE');
      expect(call).toBeDefined();
      return call!;
    });
    expect(del[0]).toBe('/api/me/specifications/saved-1');

    // Redirected away, and the deleted result is no longer held in state.
    expect(await screen.findByText('library list')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: SPEC.title })).not.toBeInTheDocument();
  });

  it('hides delete while the result has no stored record to remove', async () => {
    stubFetch({ status: 204 });
    renderResult();

    await screen.findByRole('heading', { name: SPEC.title });
    // Renaming is still available — it just stays local for an unsaved result.
    expect(screen.getByRole('button', { name: /edit specification title/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete specification/i })).not.toBeInTheDocument();
  });
});

describe('deleting the specification that is open', () => {
  it('navigates back to the library after a successful delete', async () => {
    stubFetch({ status: 204 });
    const user = userEvent.setup();
    renderDetail();

    await screen.findByText(SPEC.title);
    // Icon-only action in the title's icon group, beside the edit pencil.
    await user.click(screen.getByRole('button', { name: /delete specification/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    expect(await screen.findByText('library list')).toBeInTheDocument();
    const del = calls().find(([, init]) => init?.method === 'DELETE');
    expect(del![0]).toBe('/api/me/specifications/spec-1');
  });
});
