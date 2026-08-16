import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import {
  deleteSpecification,
  getSpecification,
  listSpecifications,
  saveSpecification,
  updateSpecificationTitle,
} from '../services/specificationStore';
import type { Specification } from '../models/specification.types';

// Authenticated persistence endpoints (feature/firebase-auth, Phase 4a). Every route requires a
// valid Firebase ID token (see authenticate middleware) and operates only on the caller's own
// records. These are additive — the generation endpoints in specifications.route.ts are
// untouched and remain anonymous.
//
//   POST   /api/me/specifications      — save a generated specification (201 { id })
//   GET    /api/me/specifications      — list the user's saved specifications (summaries)
//   GET    /api/me/specifications/:id  — fetch one saved specification in full
//   PATCH  /api/me/specifications/:id  — rename one saved specification (200 { id, title })
//   DELETE /api/me/specifications/:id  — delete one saved specification (204)

export const mySpecificationsRouter = Router();

/** Upper bound on a renamed title — generous for a headline, but not unbounded input. */
const MAX_TITLE_LENGTH = 200;

// All /api/me routes are authenticated.
mySpecificationsRouter.use(authenticate);

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Lightweight shape check for a generated specification (all nine fields, correct types). */
function isValidSpecification(value: unknown): value is Specification {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const s = value as Record<string, unknown>;

  for (const field of ['title', 'projectSummary', 'targetUsers'] as const) {
    if (typeof s[field] !== 'string' || (s[field] as string).trim() === '') {
      return false;
    }
  }
  if (
    !isNonEmptyStringArray(s.userRoles) ||
    !isNonEmptyStringArray(s.functionalRequirements) ||
    !isNonEmptyStringArray(s.nonFunctionalRequirements) ||
    !isNonEmptyStringArray(s.technicalConsiderations)
  ) {
    return false;
  }
  if (!Array.isArray(s.userStories) || !Array.isArray(s.milestones)) {
    return false;
  }
  const storiesOk = s.userStories.every(
    (it) =>
      typeof it === 'object' &&
      it !== null &&
      typeof (it as Record<string, unknown>).title === 'string' &&
      typeof (it as Record<string, unknown>).narrative === 'string' &&
      typeof (it as Record<string, unknown>).role === 'string',
  );
  const milestonesOk = s.milestones.every(
    (it) =>
      typeof it === 'object' &&
      it !== null &&
      typeof (it as Record<string, unknown>).name === 'string' &&
      typeof (it as Record<string, unknown>).description === 'string',
  );
  return storiesOk && milestonesOk;
}

/** POST /api/me/specifications — persist a generated specification for the signed-in user. */
mySpecificationsRouter.post('/specifications', async (req: Request, res: Response) => {
  const uid = req.uid as string;
  const body = req.body as { idea?: unknown; specification?: unknown } | undefined;
  const idea = typeof body?.idea === 'string' ? body.idea.trim() : '';

  if (idea === '') {
    res.status(422).json({ error: 'invalid_request', message: 'An idea is required.' });
    return;
  }
  if (!isValidSpecification(body?.specification)) {
    res.status(422).json({
      error: 'invalid_specification',
      message: 'The specification is missing or malformed.',
    });
    return;
  }

  try {
    const { id } = await saveSpecification(uid, { idea, specification: body!.specification });
    res.status(201).json({ id });
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[error] ${req.method} ${req.path}: ${name}`);
    res.status(500).json({ error: 'internal_error', message: 'Could not save the specification.' });
  }
});

/** GET /api/me/specifications — list the signed-in user's saved specifications (newest first). */
mySpecificationsRouter.get('/specifications', async (req: Request, res: Response) => {
  const uid = req.uid as string;
  try {
    const specifications = await listSpecifications(uid);
    res.status(200).json({ specifications });
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[error] ${req.method} ${req.path}: ${name}`);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Could not load your specifications.' });
  }
});

/** GET /api/me/specifications/:id — fetch one saved specification in full. */
mySpecificationsRouter.get('/specifications/:id', async (req: Request, res: Response) => {
  const uid = req.uid as string;
  const id = String(req.params.id);
  try {
    const specification = await getSpecification(uid, id);
    if (!specification) {
      res.status(404).json({ error: 'not_found', message: 'Specification not found.' });
      return;
    }
    res.status(200).json(specification);
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[error] ${req.method} ${req.path}: ${name}`);
    res.status(500).json({ error: 'internal_error', message: 'Could not load the specification.' });
  }
});

/** PATCH /api/me/specifications/:id — rename one saved specification. */
mySpecificationsRouter.patch('/specifications/:id', async (req: Request, res: Response) => {
  const uid = req.uid as string;
  const id = String(req.params.id);
  const body = req.body as { title?: unknown } | undefined;
  const title = typeof body?.title === 'string' ? body.title.trim() : '';

  if (title === '') {
    res.status(422).json({ error: 'invalid_request', message: 'A title is required.' });
    return;
  }
  if (title.length > MAX_TITLE_LENGTH) {
    res.status(422).json({
      error: 'title_too_long',
      message: `Please keep the title to ${MAX_TITLE_LENGTH} characters or fewer.`,
    });
    return;
  }

  try {
    const updated = await updateSpecificationTitle(uid, id, title);
    if (!updated) {
      res.status(404).json({ error: 'not_found', message: 'Specification not found.' });
      return;
    }
    res.status(200).json({ id, title });
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[error] ${req.method} ${req.path}: ${name}`);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Could not rename the specification.' });
  }
});

/** DELETE /api/me/specifications/:id — permanently delete one saved specification. */
mySpecificationsRouter.delete('/specifications/:id', async (req: Request, res: Response) => {
  const uid = req.uid as string;
  const id = String(req.params.id);
  try {
    const deleted = await deleteSpecification(uid, id);
    if (!deleted) {
      res.status(404).json({ error: 'not_found', message: 'Specification not found.' });
      return;
    }
    res.status(204).end();
  } catch (error) {
    const name = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[error] ${req.method} ${req.path}: ${name}`);
    res
      .status(500)
      .json({ error: 'internal_error', message: 'Could not delete the specification.' });
  }
});
