import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Contract tests for the authenticated persistence endpoints (feature/firebase-auth, Phase 4a).
// Firebase Admin (token verification) and the Firestore store are mocked so the route + auth
// middleware are exercised without a live Firebase project. Covers: 401 paths, body validation,
// and the happy paths for save / list / get.

const ctrl = vi.hoisted(() => ({
  // Set per-test: how verifyIdToken behaves for a given token.
  verifyIdToken: vi.fn(async (_token: string) => ({ uid: 'user-123' })),
  save: vi.fn(async (_uid: string, _input: unknown) => ({ id: 'spec-abc' })),
  list: vi.fn(async (_uid: string) => [] as unknown[]),
  get: vi.fn(async (_uid: string, _id: string) => null as unknown),
  updateTitle: vi.fn(async (_uid: string, _id: string, _title: string) => true),
  remove: vi.fn(async (_uid: string, _id: string) => true),
}));

vi.mock('../../src/lib/firebaseAdmin', () => ({
  FirebaseAdminError: class FirebaseAdminError extends Error {},
  getAdminAuth: () => ({ verifyIdToken: ctrl.verifyIdToken }),
  getDb: () => ({}),
}));

vi.mock('../../src/services/specificationStore', () => ({
  saveSpecification: (uid: string, input: unknown) => ctrl.save(uid, input),
  listSpecifications: (uid: string) => ctrl.list(uid),
  getSpecification: (uid: string, id: string) => ctrl.get(uid, id),
  updateSpecificationTitle: (uid: string, id: string, title: string) =>
    ctrl.updateTitle(uid, id, title),
  deleteSpecification: (uid: string, id: string) => ctrl.remove(uid, id),
}));

import { app } from '../../src/server';

const VALID_SPEC = {
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

beforeEach(() => {
  ctrl.verifyIdToken.mockReset().mockResolvedValue({ uid: 'user-123' });
  ctrl.save.mockReset().mockResolvedValue({ id: 'spec-abc' });
  ctrl.list.mockReset().mockResolvedValue([]);
  ctrl.get.mockReset().mockResolvedValue(null);
  ctrl.updateTitle.mockReset().mockResolvedValue(true);
  ctrl.remove.mockReset().mockResolvedValue(true);
});

describe('authentication (contract)', () => {
  it('401 when the Authorization header is missing', async () => {
    const res = await request(app).get('/api/me/specifications');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
    expect(ctrl.verifyIdToken).not.toHaveBeenCalled();
  });

  it('401 when the Authorization header is malformed (no Bearer prefix)', async () => {
    const res = await request(app).get('/api/me/specifications').set('Authorization', 'abc123');
    expect(res.status).toBe(401);
    expect(ctrl.verifyIdToken).not.toHaveBeenCalled();
  });

  it('401 when the ID token is invalid', async () => {
    ctrl.verifyIdToken.mockRejectedValue(new Error('token expired'));
    const res = await request(app)
      .get('/api/me/specifications')
      .set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthorized');
  });
});

describe('POST /api/me/specifications (contract)', () => {
  it('201 saves a valid specification under the token uid', async () => {
    const res = await request(app)
      .post('/api/me/specifications')
      .set('Authorization', 'Bearer good-token')
      .send({ idea: 'A habit tracking app', specification: VALID_SPEC });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('spec-abc');
    expect(ctrl.save).toHaveBeenCalledWith('user-123', {
      idea: 'A habit tracking app',
      specification: VALID_SPEC,
    });
  });

  it('422 when the specification is malformed, and does not write', async () => {
    const res = await request(app)
      .post('/api/me/specifications')
      .set('Authorization', 'Bearer good-token')
      .send({ idea: 'A habit tracking app', specification: { title: 'only a title' } });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('invalid_specification');
    expect(ctrl.save).not.toHaveBeenCalled();
  });

  it('422 when the idea is missing', async () => {
    const res = await request(app)
      .post('/api/me/specifications')
      .set('Authorization', 'Bearer good-token')
      .send({ specification: VALID_SPEC });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('invalid_request');
    expect(ctrl.save).not.toHaveBeenCalled();
  });
});

describe('GET /api/me/specifications (contract)', () => {
  it('200 returns the list of summaries for the user', async () => {
    ctrl.list.mockResolvedValue([
      { id: 'a', title: 'Alpha', idea: 'first', createdAt: '2026-07-28T00:00:00.000Z' },
    ]);
    const res = await request(app)
      .get('/api/me/specifications')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(200);
    expect(res.body.specifications).toHaveLength(1);
    expect(res.body.specifications[0].title).toBe('Alpha');
    expect(ctrl.list).toHaveBeenCalledWith('user-123');
  });
});

describe('GET /api/me/specifications/:id (contract)', () => {
  it('200 returns the full saved record when found', async () => {
    ctrl.get.mockResolvedValue({
      id: 'spec-abc',
      title: VALID_SPEC.title,
      idea: 'A habit tracking app',
      specification: VALID_SPEC,
      createdAt: '2026-07-28T00:00:00.000Z',
    });
    const res = await request(app)
      .get('/api/me/specifications/spec-abc')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('spec-abc');
    expect(res.body.specification.title).toBe(VALID_SPEC.title);
    expect(ctrl.get).toHaveBeenCalledWith('user-123', 'spec-abc');
  });

  it('404 when the record does not exist', async () => {
    ctrl.get.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/me/specifications/missing')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });
});

describe('PATCH /api/me/specifications/:id (contract)', () => {
  it('200 renames the specification under the token uid, trimming the title', async () => {
    const res = await request(app)
      .patch('/api/me/specifications/spec-abc')
      .set('Authorization', 'Bearer good-token')
      .send({ title: '  Renamed Specification  ' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 'spec-abc', title: 'Renamed Specification' });
    expect(ctrl.updateTitle).toHaveBeenCalledWith('user-123', 'spec-abc', 'Renamed Specification');
  });

  it('422 when the title is blank, and does not write', async () => {
    const res = await request(app)
      .patch('/api/me/specifications/spec-abc')
      .set('Authorization', 'Bearer good-token')
      .send({ title: '   ' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('invalid_request');
    expect(ctrl.updateTitle).not.toHaveBeenCalled();
  });

  it('422 when the title is too long, and does not write', async () => {
    const res = await request(app)
      .patch('/api/me/specifications/spec-abc')
      .set('Authorization', 'Bearer good-token')
      .send({ title: 'x'.repeat(201) });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('title_too_long');
    expect(ctrl.updateTitle).not.toHaveBeenCalled();
  });

  it('404 when the record does not exist for this user', async () => {
    ctrl.updateTitle.mockResolvedValue(false);
    const res = await request(app)
      .patch('/api/me/specifications/missing')
      .set('Authorization', 'Bearer good-token')
      .send({ title: 'Renamed' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('401 without a token, and does not write', async () => {
    const res = await request(app)
      .patch('/api/me/specifications/spec-abc')
      .send({ title: 'Renamed' });

    expect(res.status).toBe(401);
    expect(ctrl.updateTitle).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/me/specifications/:id (contract)', () => {
  it('204 deletes the specification under the token uid', async () => {
    const res = await request(app)
      .delete('/api/me/specifications/spec-abc')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(204);
    expect(ctrl.remove).toHaveBeenCalledWith('user-123', 'spec-abc');
  });

  it('404 when the record does not exist for this user', async () => {
    ctrl.remove.mockResolvedValue(false);
    const res = await request(app)
      .delete('/api/me/specifications/missing')
      .set('Authorization', 'Bearer good-token');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('not_found');
  });

  it('401 without a token, and does not delete', async () => {
    const res = await request(app).delete('/api/me/specifications/spec-abc');

    expect(res.status).toBe(401);
    expect(ctrl.remove).not.toHaveBeenCalled();
  });
});
