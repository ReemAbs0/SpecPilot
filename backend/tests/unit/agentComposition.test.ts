import { describe, it, expect, vi, beforeEach } from 'vitest';

// The prompts ask for richer per-item detail (acceptance criteria, deliverables, exit criteria)
// than the stored schema has fields for, so the agents fold that detail into the existing string
// fields. These tests pin that folding — the schema must stay { title, narrative, role } and
// { name, description, order }, with nothing the model returned silently dropped.

const ctrl = vi.hoisted(() => ({ responseText: '{}' }));

vi.mock('../../src/services/fetchAiClient', () => ({
  FetchAiError: class FetchAiError extends Error {},
  requestCompletion: vi.fn(async () => ctrl.responseText),
}));

import { generateUserStories } from '../../src/agents/userStories.agent';
import { planMilestones } from '../../src/agents/milestones.agent';

const IDEA = 'A dog walker booking app with live tracking, in-app payments and an admin console.';

beforeEach(() => {
  ctrl.responseText = '{}';
});

describe('generateUserStories', () => {
  it('folds acceptance criteria into the narrative, keeping the story schema unchanged', async () => {
    ctrl.responseText = JSON.stringify({
      userStories: [
        {
          title: 'Reschedule a booking',
          narrative: 'As a Dog Owner, I want to reschedule a walk, so that I can adapt my day.',
          role: 'Dog Owner',
          acceptanceCriteria: [
            'Given a confirmed booking more than 2 hours away, when I pick a new slot, then it is rebooked.',
            'Given a booking under 2 hours away, when I try to reschedule, then it is refused.',
          ],
        },
      ],
    });

    const { userStories } = await generateUserStories(IDEA, { userRoles: ['Dog Owner'] }, {});

    expect(Object.keys(userStories[0]).sort()).toEqual(['narrative', 'role', 'title']);
    expect(userStories[0].narrative).toContain('so that I can adapt my day.');
    expect(userStories[0].narrative).toContain('Acceptance Criteria:');
    expect(userStories[0].narrative).toContain('- Given a booking under 2 hours away');
  });

  it('strips an appended role description and snaps to the canonical role spelling', async () => {
    ctrl.responseText = JSON.stringify({
      userStories: [
        {
          title: 'Accept a booking',
          narrative: 'As a Dog Walker, I want to accept a booking.',
          role: 'dog walker: service providers who accept or decline booking requests',
        },
      ],
    });

    const { userStories } = await generateUserStories(IDEA, { userRoles: ['Dog Walker'] }, {});
    expect(userStories[0].role).toBe('Dog Walker');
  });

  it('accepts a story with no acceptance criteria', async () => {
    ctrl.responseText = JSON.stringify({
      userStories: [
        { title: 'Book', narrative: 'As a Dog Owner, I want to book.', role: 'Dog Owner' },
      ],
    });

    const { userStories } = await generateUserStories(IDEA, { userRoles: ['Dog Owner'] }, {});
    expect(userStories[0].narrative).toBe('As a Dog Owner, I want to book.');
  });
});

describe('planMilestones', () => {
  it('folds deliverables, exit criteria and duration into the description', async () => {
    ctrl.responseText = JSON.stringify({
      milestones: [
        {
          name: 'Phase 1 — Foundations',
          description: 'Stands up the environment, data model and authentication.',
          deliverables: ['Postgres schema for bookings', 'Email/password auth'],
          exitCriteria: ['A user can register and sign in on staging'],
          duration: '2-3 weeks',
        },
      ],
    });

    const { milestones } = await planMilestones(IDEA, {}, {});

    expect(milestones[0].order).toBe(1);
    expect(milestones[0].description).toContain('Stands up the environment');
    expect(milestones[0].description).toContain('Deliverables:\n- Postgres schema for bookings');
    expect(milestones[0].description).toContain('Exit criteria:\n- A user can register');
    expect(milestones[0].description).toContain('Estimated duration: 2-3 weeks');
  });

  it('keeps a bare name/description milestone intact', async () => {
    ctrl.responseText = JSON.stringify({
      milestones: [{ name: 'MVP', description: 'Core booking flow.' }],
    });

    const { milestones } = await planMilestones(IDEA, {}, {});
    expect(milestones[0].description).toBe('Core booking flow.');
  });
});
