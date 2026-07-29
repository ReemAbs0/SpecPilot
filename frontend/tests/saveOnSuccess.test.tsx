import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { GENERATION_STAGES } from '../src/types/specification.types';

// Phase 4b: verifies that a successful generation is persisted to /api/me/specifications ONLY
// when a user is signed in, and that guests can still generate with no save attempted. The
// auth state is mocked so no real Firebase project is needed; POST + SSE are mocked as in
// flow.test.tsx.

const authCtrl = vi.hoisted(() => ({
  user: null as null | { uid: string; email: string; getIdToken: () => Promise<string> },
}));

vi.mock('../src/state/AuthContext', () => ({
  // Pass-through provider; the app reads auth solely through the mocked useAuth.
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: authCtrl.user,
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const SPEC = {
  title: 'Dog Walker Booking App Specification',
  projectSummary: 'A mobile app connecting dog owners with professional walkers.',
  targetUsers: 'Dog owners and professional dog walkers',
  userRoles: ['Dog Owner', 'Dog Walker'],
  functionalRequirements: ['Book a walk', 'Live GPS tracking'],
  nonFunctionalRequirements: ['99.9% uptime'],
  userStories: [
    { title: 'Book a walk', narrative: 'As a Dog Owner, I want to book a walk', role: 'Dog Owner' },
  ],
  milestones: [{ name: 'MVP', description: 'Booking and tracking', order: 1 }],
  technicalConsiderations: ['React Native'],
};

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  url: string;
  listeners: Record<string, Array<(e: MessageEvent) => void>> = {};
  onerror: ((e: Event) => void) | null = null;
  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }
  addEventListener(type: string, cb: (e: MessageEvent) => void) {
    (this.listeners[type] ??= []).push(cb);
  }
  close() {}
  emit(type: string, data: unknown) {
    (this.listeners[type] ?? []).forEach((cb) => cb({ data: JSON.stringify(data) } as MessageEvent));
  }
}

function driveSuccessfulStream() {
  const es = FakeEventSource.instances.at(-1);
  if (!es) throw new Error('No EventSource opened');
  act(() => {
    for (const stage of GENERATION_STAGES) {
      es.emit('stage-started', { stage });
      es.emit('stage-completed', { stage });
    }
    es.emit('generation-succeeded', { specification: SPEC });
  });
}

// A fetch mock that distinguishes the generation POST from the save POST.
function makeFetchMock() {
  return vi.fn(async (url: string) => {
    if (url === '/api/me/specifications') {
      return { status: 201, json: async () => ({ id: 'saved-1' }) } as Response;
    }
    // Generation start (POST /api/specifications).
    return { status: 202, json: async () => ({ sessionId: 'test-session' }) } as Response;
  });
}

async function generateOnce() {
  const user = userEvent.setup();
  render(<App />);
  const textarea = await screen.findByLabelText(/describe your software idea/i);
  await user.type(textarea, 'A mobile app for dog walkers with booking, GPS tracking, and payments.');
  await user.click(screen.getByRole('button', { name: /generate specification/i }));
  await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(0));
  driveSuccessfulStream();
  // Confirm the result rendered — generation behavior is unaffected in both cases.
  expect(await screen.findByText(SPEC.title)).toBeInTheDocument();
}

beforeEach(() => {
  FakeEventSource.instances = [];
  authCtrl.user = null;
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.stubGlobal('fetch', makeFetchMock());
  window.history.pushState({}, '', '/generate');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('save-on-success (Phase 4b)', () => {
  it('saves the specification with a Bearer token when signed in', async () => {
    authCtrl.user = {
      uid: 'user-123',
      email: 'user@example.com',
      getIdToken: vi.fn(async () => 'id-token-abc'),
    };

    await generateOnce();

    await waitFor(() => {
      const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
      const saveCall = calls.find(([url]) => url === '/api/me/specifications');
      expect(saveCall).toBeDefined();
      const init = saveCall![1] as RequestInit;
      expect(init.method).toBe('POST');
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer id-token-abc');
      const body = JSON.parse(init.body as string);
      expect(body.specification.title).toBe(SPEC.title);
      expect(typeof body.idea).toBe('string');
    });
  });

  it('does NOT save for a guest, but still shows the generated result', async () => {
    authCtrl.user = null;

    await generateOnce();

    // Give any stray async work a chance to run, then assert no save call was made.
    await Promise.resolve();
    const calls = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    const saveCall = calls.find(([url]) => url === '/api/me/specifications');
    expect(saveCall).toBeUndefined();
  });
});
