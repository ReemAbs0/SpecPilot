import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GeneratorPage from '../src/pages/GeneratorPage';
import { SpecificationProvider } from '../src/state/SpecificationContext';
import { specReducer, initialSpecState, type SpecState } from '../src/state/specificationReducer';

// Regression: generation state leaked between accounts. SpecificationProvider is mounted for the
// lifetime of the tab, so Account A's idea text (and generated specification) was still there
// after signing out and signing in as Account B. State is now owned by a uid and reset when the
// owner changes.

const authCtrl = vi.hoisted(() => ({
  user: null as { uid: string } | null,
  loading: false,
}));

vi.mock('../src/state/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: authCtrl.user, loading: authCtrl.loading }),
}));

const IDEA = 'A dog walking marketplace with live GPS tracking and in-app payments.';

function renderGenerator() {
  return render(
    <MemoryRouter initialEntries={['/generate']}>
      <SpecificationProvider>
        <GeneratorPage />
      </SpecificationProvider>
    </MemoryRouter>,
  );
}

function ideaField(): HTMLTextAreaElement {
  return screen.getByRole('textbox', { name: /describe your software idea/i });
}

beforeEach(() => {
  authCtrl.user = null;
  authCtrl.loading = false;
});

describe('generation state across authentication changes', () => {
  it("does not carry one account's idea into the next account (reported bug)", async () => {
    const user = userEvent.setup();
    authCtrl.user = { uid: 'account-a' };
    const { rerender } = renderGenerator();

    await user.type(ideaField(), IDEA);
    expect(ideaField()).toHaveValue(IDEA);

    // Sign out.
    authCtrl.user = null;
    rerender(
      <MemoryRouter initialEntries={['/generate']}>
        <SpecificationProvider>
          <GeneratorPage />
        </SpecificationProvider>
      </MemoryRouter>,
    );
    expect(ideaField()).toHaveValue('');

    // Sign in as a different account.
    authCtrl.user = { uid: 'account-b' };
    rerender(
      <MemoryRouter initialEntries={['/generate']}>
        <SpecificationProvider>
          <GeneratorPage />
        </SpecificationProvider>
      </MemoryRouter>,
    );
    expect(ideaField()).toHaveValue('');
  });

  it("keeps a guest's work when they sign in, so it can still be saved", async () => {
    const user = userEvent.setup();
    const { rerender } = renderGenerator();

    await user.type(ideaField(), IDEA);

    authCtrl.user = { uid: 'account-a' };
    rerender(
      <MemoryRouter initialEntries={['/generate']}>
        <SpecificationProvider>
          <GeneratorPage />
        </SpecificationProvider>
      </MemoryRouter>,
    );

    expect(ideaField()).toHaveValue(IDEA);
  });

  it('leaves state untouched while auth is still resolving', async () => {
    const user = userEvent.setup();
    authCtrl.user = null;
    authCtrl.loading = true;
    const { rerender } = renderGenerator();

    await user.type(ideaField(), IDEA);

    // Auth resolves to a restored session: "no user yet" must not have been read as a sign-out.
    authCtrl.user = { uid: 'account-a' };
    authCtrl.loading = false;
    rerender(
      <MemoryRouter initialEntries={['/generate']}>
        <SpecificationProvider>
          <GeneratorPage />
        </SpecificationProvider>
      </MemoryRouter>,
    );

    expect(ideaField()).toHaveValue(IDEA);
  });
});

// The reducer owns the decision of what survives a change of identity, so the rules are pinned
// here directly — including the fields the UI test above cannot see.
describe('specReducer AUTH_CHANGED', () => {
  const generated: SpecState = {
    ...initialSpecState,
    status: 'success',
    ownerUid: 'account-a',
    ideaText: IDEA,
    sessionId: 'session-1',
    completedStages: ['understanding-idea'],
    specification: { title: 'Dog Walking Spec' } as SpecState['specification'],
    savedId: 'firestore-doc-1',
  };

  it('clears every field of the previous account on sign-out', () => {
    const next = specReducer(generated, { type: 'AUTH_CHANGED', uid: null });
    expect(next).toEqual({ ...initialSpecState, ownerUid: null });
    // Most importantly, no stale pointer into the previous account's Firestore records.
    expect(next.savedId).toBeNull();
    expect(next.specification).toBeNull();
    expect(next.ideaText).toBe('');
  });

  it('clears when switching straight from one account to another', () => {
    const next = specReducer(generated, { type: 'AUTH_CHANGED', uid: 'account-b' });
    expect(next).toEqual({ ...initialSpecState, ownerUid: 'account-b' });
  });

  it('adopts guest state on sign-in instead of discarding it', () => {
    const guest: SpecState = { ...generated, ownerUid: null };
    const next = specReducer(guest, { type: 'AUTH_CHANGED', uid: 'account-a' });
    expect(next).toEqual({ ...guest, ownerUid: 'account-a' });
  });

  it('is a no-op for the same uid, so a token refresh cannot disturb a running generation', () => {
    const running: SpecState = { ...generated, status: 'generating' };
    const next = specReducer(running, { type: 'AUTH_CHANGED', uid: 'account-a' });
    expect(next).toBe(running);
  });

  it('keeps the owner through a cancel, so the next sign-out still clears', () => {
    const cancelled = specReducer(generated, { type: 'CANCEL' });
    expect(cancelled.ownerUid).toBe('account-a');
    expect(specReducer(cancelled, { type: 'AUTH_CHANGED', uid: null }).ideaText).toBe('');
  });
});
