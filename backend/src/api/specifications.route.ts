import { Router, type Request, type Response } from 'express';
import {
  cancelSession,
  createSession,
  deleteSession,
  getSession,
  hasActiveGeneration,
  runGeneration,
  type SseEvent,
} from '../services/specificationOrchestrator';

// HTTP surface for generation (T021 POST, T022 SSE stream). See contracts/api.md.

export const specificationsRouter = Router();

function ideaBounds(): { min: number; max: number } {
  return {
    min: Number(process.env.IDEA_MIN_LENGTH) || 20,
    max: Number(process.env.IDEA_MAX_LENGTH) || 2000,
  };
}

/** POST /api/specifications — validate the idea and start a session (202 { sessionId }). */
specificationsRouter.post('/specifications', (req: Request, res: Response) => {
  const { min, max } = ideaBounds();
  const rawIdea = (req.body as { idea?: unknown } | undefined)?.idea;
  const idea = typeof rawIdea === 'string' ? rawIdea.trim() : '';

  if (idea.length < min) {
    res.status(422).json({
      error: 'idea_too_short',
      message: `Tell us a bit more about your idea (at least ${min} characters).`,
    });
    return;
  }
  if (idea.length > max) {
    res.status(422).json({
      error: 'idea_too_long',
      message: `Please shorten your description to ${max} characters or fewer.`,
    });
    return;
  }

  // Prevent overlapping generations (FR-007): one active generation at a time.
  if (hasActiveGeneration()) {
    res.status(409).json({
      error: 'generation_in_progress',
      message: 'A specification is already being generated. Please wait for it to finish.',
    });
    return;
  }

  const session = createSession({ text: idea });
  res.status(202).json({ sessionId: session.id });
});

function writeSseEvent(res: Response, event: SseEvent): void {
  if (res.writableEnded) {
    return;
  }
  res.write(`event: ${event.event}\n`);
  res.write(`data: ${JSON.stringify(event.data)}\n\n`);
}

/** GET /api/specifications/:sessionId/stream — stream stage progress + the terminal result. */
specificationsRouter.get(
  '/specifications/:sessionId/stream',
  async (req: Request, res: Response) => {
    const sessionId = String(req.params.sessionId);
    const session = getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'not_found', message: 'Generation session not found.' });
      return;
    }
    if (session.started) {
      res.status(409).json({ error: 'stream_already_open', message: 'Stream already opened.' });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(': connected\n\n');

    // A client disconnect before the run finishes is a cancellation (FR-011b).
    req.on('close', () => {
      if (session.status === 'running') {
        cancelSession(session);
      }
    });

    try {
      await runGeneration(session, (event) => writeSseEvent(res, event));
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
      deleteSession(session.id);
    }
  },
);
