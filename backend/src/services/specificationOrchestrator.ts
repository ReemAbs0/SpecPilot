import { randomUUID } from 'crypto';
import {
  GENERATION_STAGES,
  type GenerationSession,
  type GenerationStage,
  type ProjectIdea,
  type Specification,
} from '../models/specification.types';
import { analyzeIdea } from '../agents/ideaAnalysis.agent';
import { generateRequirements } from '../agents/requirements.agent';
import { generateUserStories } from '../agents/userStories.agent';
import { planMilestones } from '../agents/milestones.agent';
import { formatSpecification } from '../agents/formatting.agent';

// Generation orchestration + in-memory session lifecycle (T020). Runs the five agent stages
// in fixed order, emits progress events, enforces the max wait time (FR-011a), and supports
// cancellation (FR-011b). Nothing is persisted — sessions live only for their generation and
// are deleted afterward (FR-017).

/** SSE events emitted to the client (see contracts/api.md). */
export type SseEvent =
  | { event: 'stage-started'; data: { stage: GenerationStage } }
  | { event: 'stage-completed'; data: { stage: GenerationStage } }
  | { event: 'generation-succeeded'; data: { specification: Specification } }
  | { event: 'generation-failed'; data: { reason: 'upstream-error' | 'timeout' } };

/** Internal session record — extends the shared shape with runtime-only control fields. */
interface Session extends GenerationSession {
  specification: Specification | null;
  started: boolean;
  timedOut: boolean;
  abort: AbortController;
  idleCleanup: ReturnType<typeof setTimeout> | null;
}

const sessions = new Map<string, Session>();

// If the client never opens the stream after POST, drop the orphaned session after this long.
const IDLE_SESSION_TTL_MS = 30_000;

/** True if any generation is currently running — used to reject overlapping POSTs (FR-007). */
export function hasActiveGeneration(): boolean {
  for (const session of sessions.values()) {
    if (session.status === 'running') {
      return true;
    }
  }
  return false;
}

/** Registers a new running session for an idea and returns it. Generation begins when the
 *  client opens the stream and `runGeneration` is called. */
export function createSession(idea: ProjectIdea): Session {
  const session: Session = {
    id: randomUUID(),
    idea,
    status: 'running',
    activeStage: null,
    completedStages: [],
    failureReason: null,
    specification: null,
    started: false,
    timedOut: false,
    abort: new AbortController(),
    idleCleanup: null,
  };
  session.idleCleanup = setTimeout(() => {
    if (!session.started) {
      deleteSession(session.id);
    }
  }, IDLE_SESSION_TTL_MS);
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function deleteSession(id: string): void {
  const session = sessions.get(id);
  if (session?.idleCleanup) {
    clearTimeout(session.idleCleanup);
  }
  sessions.delete(id);
}

/** Cancels an in-progress session (FR-011b): aborts the run without a timeout reason. */
export function cancelSession(session: Session): void {
  if (session.status === 'running') {
    session.abort.abort();
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'AbortError'
  );
}

async function runStage(
  stage: GenerationStage,
  ideaText: string,
  draft: Partial<Specification>,
  opts: { signal: AbortSignal },
): Promise<void> {
  switch (stage) {
    case 'understanding-idea':
      Object.assign(draft, await analyzeIdea(ideaText, opts));
      break;
    case 'generating-requirements':
      Object.assign(draft, await generateRequirements(ideaText, opts));
      break;
    case 'creating-user-stories':
      Object.assign(draft, await generateUserStories(ideaText, draft.userRoles ?? [], opts));
      break;
    case 'preparing-milestones':
      Object.assign(draft, await planMilestones(ideaText, opts));
      break;
    case 'formatting-document':
      // Formatting assembles + validates the complete specification from the draft.
      Object.assign(draft, await formatSpecification(ideaText, draft, opts));
      break;
  }
}

/**
 * Runs the five stages in order, emitting events via `onEvent`. Resolves when the session is
 * terminal (succeeded / failed / cancelled). Enforces GENERATION_TIMEOUT_MS (FR-011a).
 */
export async function runGeneration(
  session: Session,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  if (session.started) {
    return;
  }
  session.started = true;
  if (session.idleCleanup) {
    clearTimeout(session.idleCleanup);
    session.idleCleanup = null;
  }

  const timeoutMs = Number(process.env.GENERATION_TIMEOUT_MS) || 90_000;
  const timer = setTimeout(() => {
    session.timedOut = true;
    session.abort.abort();
  }, timeoutMs);
  const signal = session.abort.signal;

  try {
    const draft: Partial<Specification> = {};
    for (const stage of GENERATION_STAGES) {
      signal.throwIfAborted();
      session.activeStage = stage;
      onEvent({ event: 'stage-started', data: { stage } });
      await runStage(stage, session.idea.text, draft, { signal });
      session.completedStages.push(stage);
      onEvent({ event: 'stage-completed', data: { stage } });
    }

    const specification = draft as Specification; // formatting stage validated completeness
    session.status = 'succeeded';
    session.specification = specification;
    session.activeStage = null;
    onEvent({ event: 'generation-succeeded', data: { specification } });
  } catch (error) {
    session.activeStage = null;
    if (isAbortError(error)) {
      if (session.timedOut) {
        session.status = 'failed';
        session.failureReason = 'timeout';
        onEvent({ event: 'generation-failed', data: { reason: 'timeout' } });
      } else {
        // User cancellation (FR-011b): no failureReason, and no SSE event is emitted.
        session.status = 'cancelled';
      }
    } else {
      session.status = 'failed';
      session.failureReason = 'upstream-error';
      onEvent({ event: 'generation-failed', data: { reason: 'upstream-error' } });
    }
  } finally {
    clearTimeout(timer);
  }
}
