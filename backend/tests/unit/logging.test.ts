import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

// FR-017: idea text and generated specification content must never appear in log output.
// The AI call is mocked to return a specification carrying a distinctive marker so we can
// assert that marker (and the idea marker) never reaches the console.
const SPEC_MARKER = 'SPEC-CONTENT-MARKER-9f3a';
const IDEA_MARKER = 'IDEA-CONTENT-MARKER-9f3a';

const ctrl = vi.hoisted(() => ({ responseText: '{}' }));

vi.mock('../../src/services/fetchAiClient', () => ({
  FetchAiError: class FetchAiError extends Error {},
  requestCompletion: vi.fn(async () => ctrl.responseText),
}));

import { app } from '../../src/server';

const SPEC = {
  title: `${SPEC_MARKER} Specification`,
  projectSummary: `Summary ${SPEC_MARKER}`,
  targetUsers: 'Users',
  userRoles: ['Admin'],
  functionalRequirements: ['Requirement'],
  nonFunctionalRequirements: ['Reliable'],
  userStories: [{ title: 'Story', narrative: 'As an Admin, I want X', role: 'Admin' }],
  milestones: [{ name: 'MVP', description: 'Core' }],
  technicalConsiderations: ['Consideration'],
};

let logged: string[] = [];

beforeEach(() => {
  ctrl.responseText = JSON.stringify(SPEC);
  process.env.IDEA_MIN_LENGTH = '20';
  process.env.IDEA_MAX_LENGTH = '2000';
  logged = [];
  const capture =
    () =>
    (...args: unknown[]) => {
      logged.push(args.map(String).join(' '));
    };
  vi.spyOn(console, 'log').mockImplementation(capture());
  vi.spyOn(console, 'error').mockImplementation(capture());
  vi.spyOn(console, 'warn').mockImplementation(capture());
  vi.spyOn(console, 'info').mockImplementation(capture());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logging never leaks request/response bodies (FR-017)', () => {
  it('a full generation logs neither the idea text nor the specification content', async () => {
    const idea = `A tool about ${IDEA_MARKER} with booking, tracking, and reports for teams.`;
    const post = await request(app).post('/api/specifications').send({ idea });
    expect(post.status).toBe(202);
    const stream = await request(app).get(`/api/specifications/${post.body.sessionId}/stream`);
    expect(stream.text).toContain('generation-succeeded'); // the flow really ran

    const output = logged.join('\n');
    expect(output).not.toContain(IDEA_MARKER);
    expect(output).not.toContain(SPEC_MARKER);
  });

  it('the error handler logs method/path/error name but never the raw request body', async () => {
    const res = await request(app)
      .post('/api/specifications')
      .set('Content-Type', 'application/json')
      .send(`{"idea": "${IDEA_MARKER}"`); // malformed JSON → parse error → error handler

    expect(res.status).toBe(500);
    const output = logged.join('\n');
    // The body marker must not be logged...
    expect(output).not.toContain(IDEA_MARKER);
    // ...but the handler did log the request context (method + path).
    expect(output).toContain('POST /api/specifications');
  });
});
