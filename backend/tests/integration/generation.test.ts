import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Controllable stand-in for the hosted AI call, so the flow can be exercised deterministically
// (happy path, cancellation, timeout, upstream error) without a live Fetch.ai endpoint.
const ctrl = vi.hoisted(() => ({ responseText: '{}', delayMs: 0 }));

function abortError(): Error {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

vi.mock('../../src/services/fetchAiClient', () => ({
  FetchAiError: class FetchAiError extends Error {},
  requestCompletion: vi.fn(
    (_messages: unknown, opts: { signal?: AbortSignal } = {}) =>
      new Promise<string>((resolve, reject) => {
        if (opts.signal?.aborted) {
          reject(abortError());
          return;
        }
        const timer = setTimeout(() => resolve(ctrl.responseText), ctrl.delayMs);
        opts.signal?.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(abortError());
        });
      }),
  ),
}));

import { app } from '../../src/server';
import {
  createSession,
  runGeneration,
  cancelSession,
  deleteSession,
  type SseEvent,
} from '../../src/services/specificationOrchestrator';

const SUPERSET = {
  title: 'Dog Walker Booking App Specification',
  projectSummary: 'A mobile app connecting dog owners with walkers, with booking and tracking.',
  targetUsers: 'Dog owners and professional dog walkers',
  userRoles: ['Dog Owner', 'Dog Walker', 'Admin'],
  functionalRequirements: ['Book a walk', 'Live GPS tracking', 'Integrated payments'],
  nonFunctionalRequirements: ['99.9% uptime', 'GDPR-compliant', 'Sub-second updates'],
  userStories: [
    { title: 'Book a walk', narrative: 'As a Dog Owner, I want to book a walk', role: 'Dog Owner' },
  ],
  milestones: [{ name: 'MVP', description: 'Booking and tracking' }],
  technicalConsiderations: ['React Native', 'WebSocket GPS', 'PCI-compliant payments'],
};

beforeEach(() => {
  ctrl.responseText = JSON.stringify(SUPERSET);
  ctrl.delayMs = 0;
  process.env.IDEA_MIN_LENGTH = '20';
  process.env.IDEA_MAX_LENGTH = '2000';
  process.env.GENERATION_TIMEOUT_MS = '90000';
});

const VALID_IDEA = 'A mobile app for dog walkers with booking, GPS tracking, and payments.';

describe('POST /api/specifications validation', () => {
  it('rejects an idea below the minimum length (422)', async () => {
    const res = await request(app).post('/api/specifications').send({ idea: 'too short' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('idea_too_short');
  });

  it('rejects an idea above the maximum length (422)', async () => {
    const res = await request(app)
      .post('/api/specifications')
      .send({ idea: 'a'.repeat(2100) });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('idea_too_long');
  });

  it('accepts a valid idea (202) and rejects a concurrent one (409)', async () => {
    const first = await request(app).post('/api/specifications').send({ idea: VALID_IDEA });
    expect(first.status).toBe(202);
    expect(typeof first.body.sessionId).toBe('string');

    const second = await request(app).post('/api/specifications').send({ idea: VALID_IDEA });
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('generation_in_progress');

    deleteSession(first.body.sessionId);
  });
});

describe('generation orchestration', () => {
  it('runs all five stages in order and produces a complete specification', async () => {
    const session = createSession({ text: VALID_IDEA });
    const events: SseEvent[] = [];
    await runGeneration(session, (event) => events.push(event));

    expect(events.map((e) => e.event)).toEqual([
      'stage-started',
      'stage-completed',
      'stage-started',
      'stage-completed',
      'stage-started',
      'stage-completed',
      'stage-started',
      'stage-completed',
      'stage-started',
      'stage-completed',
      'generation-succeeded',
    ]);

    const terminal = events.at(-1);
    expect(terminal?.event).toBe('generation-succeeded');
    if (terminal?.event === 'generation-succeeded') {
      const spec = terminal.data.specification;
      for (const key of Object.keys(SUPERSET)) {
        expect(spec[key as keyof typeof spec]).toBeTruthy();
      }
    }
    expect(session.status).toBe('succeeded');
    deleteSession(session.id);
  });

  it('cancellation stops the run with no terminal event and status "cancelled" (FR-011b)', async () => {
    ctrl.delayMs = 1000;
    const session = createSession({ text: VALID_IDEA });
    const events: SseEvent[] = [];
    const run = runGeneration(session, (event) => events.push(event));

    await new Promise((resolve) => setTimeout(resolve, 50));
    cancelSession(session);
    await run;

    expect(session.status).toBe('cancelled');
    expect(events.some((e) => e.event === 'generation-succeeded')).toBe(false);
    expect(events.some((e) => e.event === 'generation-failed')).toBe(false);
    deleteSession(session.id);
  });

  it('emits generation-failed "timeout" when the max wait time is exceeded (FR-011a)', async () => {
    process.env.GENERATION_TIMEOUT_MS = '50';
    ctrl.delayMs = 1000;
    const session = createSession({ text: VALID_IDEA });
    const events: SseEvent[] = [];
    await runGeneration(session, (event) => events.push(event));

    const terminal = events.at(-1);
    expect(terminal?.event).toBe('generation-failed');
    if (terminal?.event === 'generation-failed') {
      expect(terminal.data.reason).toBe('timeout');
    }
    expect(session.status).toBe('failed');
    expect(session.failureReason).toBe('timeout');
    deleteSession(session.id);
  });

  it('emits generation-failed "upstream-error" when the model output is unusable', async () => {
    ctrl.responseText = 'this is not json';
    const session = createSession({ text: VALID_IDEA });
    const events: SseEvent[] = [];
    await runGeneration(session, (event) => events.push(event));

    const terminal = events.at(-1);
    expect(terminal?.event).toBe('generation-failed');
    if (terminal?.event === 'generation-failed') {
      expect(terminal.data.reason).toBe('upstream-error');
    }
    expect(session.status).toBe('failed');
    expect(session.failureReason).toBe('upstream-error');
    deleteSession(session.id);
  });
});
