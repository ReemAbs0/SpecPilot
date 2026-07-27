import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Contract tests for the HTTP surface in contracts/api.md: POST /api/specifications
// (validation + 202/409 shapes) and the SSE stream event shapes. The hosted AI call is
// mocked so the pipeline runs deterministically without a live endpoint.
const ctrl = vi.hoisted(() => ({ responseText: '{}' }));

vi.mock('../../src/services/fetchAiClient', () => ({
  FetchAiError: class FetchAiError extends Error {},
  requestCompletion: vi.fn(async () => ctrl.responseText),
}));

import { app } from '../../src/server';
import { deleteSession } from '../../src/services/specificationOrchestrator';

const SUPERSET = {
  title: 'Dog Walker Booking App Specification',
  projectSummary: 'A mobile app connecting dog owners with walkers.',
  targetUsers: 'Dog owners and walkers',
  userRoles: ['Dog Owner', 'Dog Walker'],
  functionalRequirements: ['Book a walk', 'Live GPS tracking'],
  nonFunctionalRequirements: ['99.9% uptime'],
  userStories: [{ title: 'Book', narrative: 'As a Dog Owner, I want to book', role: 'Dog Owner' }],
  milestones: [{ name: 'MVP', description: 'Booking' }],
  technicalConsiderations: ['React Native'],
};

const VALID_IDEA = 'A mobile app for dog walkers with booking, GPS tracking, and payments.';

beforeEach(() => {
  ctrl.responseText = JSON.stringify(SUPERSET);
  process.env.IDEA_MIN_LENGTH = '20';
  process.env.IDEA_MAX_LENGTH = '2000';
  process.env.GENERATION_TIMEOUT_MS = '90000';
});

describe('POST /api/specifications (contract)', () => {
  it('202 returns { sessionId } for a valid idea', async () => {
    const res = await request(app).post('/api/specifications').send({ idea: VALID_IDEA });
    expect(res.status).toBe(202);
    expect(typeof res.body.sessionId).toBe('string');
    deleteSession(res.body.sessionId);
  });

  it('422 idea_too_short for a short idea, with error + message', async () => {
    const res = await request(app).post('/api/specifications').send({ idea: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('idea_too_short');
    expect(typeof res.body.message).toBe('string');
  });

  it('422 idea_too_long for an over-long idea', async () => {
    const res = await request(app)
      .post('/api/specifications')
      .send({ idea: 'a'.repeat(2100) });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('idea_too_long');
  });

  it('409 generation_in_progress while another session is active', async () => {
    const first = await request(app).post('/api/specifications').send({ idea: VALID_IDEA });
    const second = await request(app).post('/api/specifications').send({ idea: VALID_IDEA });
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('generation_in_progress');
    deleteSession(first.body.sessionId);
  });
});

describe('GET /api/specifications/:id/stream (contract)', () => {
  it('404 not_found for an unknown session', async () => {
    const res = await request(app).get('/api/specifications/does-not-exist/stream');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('streams SSE stage events then generation-succeeded with a full specification', async () => {
    const post = await request(app).post('/api/specifications').send({ idea: VALID_IDEA });
    const sessionId = post.body.sessionId as string;

    const res = await request(app).get(`/api/specifications/${sessionId}/stream`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');

    // Five ordered stages, each with a start + complete event.
    const stageStarts = res.text.match(/event: stage-started/g) ?? [];
    const stageCompletes = res.text.match(/event: stage-completed/g) ?? [];
    expect(stageStarts).toHaveLength(5);
    expect(stageCompletes).toHaveLength(5);
    expect(res.text).toContain('"stage":"understanding-idea"');
    expect(res.text).toContain('"stage":"formatting-document"');

    // Terminal success event carries a specification with all nine fields.
    expect(res.text).toContain('event: generation-succeeded');
    const match = res.text.match(/event: generation-succeeded\ndata: (.*)/);
    expect(match).not.toBeNull();
    const spec = JSON.parse(match![1]).specification;
    for (const key of Object.keys(SUPERSET)) {
      expect(spec[key]).toBeTruthy();
    }
  });
});
