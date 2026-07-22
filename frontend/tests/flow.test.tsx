import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../src/App';
import { GENERATION_STAGES } from '../src/types/specification.types';

// End-to-end flow test for User Story 1 (verification): generator → progress → result, with
// the network (POST) and SSE stream mocked so the flow is exercised deterministically.

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
    (this.listeners[type] ?? []).forEach((cb) =>
      cb({ data: JSON.stringify(data) } as MessageEvent),
    );
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

beforeEach(() => {
  FakeEventSource.instances = [];
  vi.stubGlobal('EventSource', FakeEventSource);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ status: 202, json: async () => ({ sessionId: 'test-session' }) })),
  );
  window.history.pushState({}, '', '/');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('User Story 1 — idea to specification', () => {
  it('generates a specification and shows all sections', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    const textarea = await screen.findByLabelText(/describe your software idea/i);
    await user.type(
      textarea,
      'A mobile app for dog walkers with booking, GPS tracking, and payments.',
    );
    await user.click(screen.getByRole('button', { name: /generate specification/i }));

    // Progress screen appears.
    expect(await screen.findByText(/generating your specification/i)).toBeInTheDocument();

    // Drive the stream to completion → navigates to the result.
    await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(0));
    driveSuccessfulStream();

    // Result screen shows the title and representative sections.
    expect(await screen.findByText(SPEC.title)).toBeInTheDocument();
    expect(screen.getByText(/generated successfully/i)).toBeInTheDocument();
    expect(screen.getByText('Project Summary')).toBeInTheDocument();
    expect(screen.getByText('Technical Considerations')).toBeInTheDocument();
    expect(screen.getByText(SPEC.projectSummary)).toBeInTheDocument();
  });

  it('blocks submitting an idea that is too short and does not call the API', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    const textarea = await screen.findByLabelText(/describe your software idea/i);
    await user.type(textarea, 'too short');
    await user.click(screen.getByRole('button', { name: /generate specification/i }));

    expect(await screen.findByText(/at least 20 characters/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});
