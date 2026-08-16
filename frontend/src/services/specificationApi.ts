import type {
  GenerationFailureReason,
  GenerationStage,
  Specification,
} from '../types/specification.types';
import { apiUrl } from './apiBase';

// Talks to the backend generation endpoints (T026). URLs are built via apiUrl(): relative in
// dev (Vite proxy) and absolute cross-origin in production (VITE_API_BASE_URL → Render backend,
// which enables CORS). See contracts/api.md.

export interface StartSuccess {
  ok: true;
  sessionId: string;
}
export interface StartFailure {
  ok: false;
  error: { code: string; message: string };
}
export type StartResult = StartSuccess | StartFailure;

/** POST /api/specifications — begins a generation session for the given idea. */
export async function startGeneration(ideaText: string): Promise<StartResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl('/api/specifications'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: ideaText }),
    });
  } catch {
    return { ok: false, error: { code: 'network_error', message: 'Could not reach the server.' } };
  }

  if (response.status === 202) {
    const body = (await response.json()) as { sessionId: string };
    return { ok: true, sessionId: body.sessionId };
  }

  // 422 (validation) and 409 (already generating) carry a machine code + user message.
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return {
      ok: false,
      error: {
        code: body.error ?? 'error',
        message: body.message ?? 'Something went wrong starting generation.',
      },
    };
  } catch {
    return {
      ok: false,
      error: { code: 'error', message: 'Something went wrong starting generation.' },
    };
  }
}

export interface StreamHandlers {
  onStageStarted: (stage: GenerationStage) => void;
  onStageCompleted: (stage: GenerationStage) => void;
  onSucceeded: (specification: Specification) => void;
  onFailed: (reason: GenerationFailureReason) => void;
}

/**
 * Opens the SSE progress stream for a session and wires events to the handlers. Returns a
 * function that closes the stream. Closing before a terminal event (e.g. user cancel) is a
 * cancellation on the backend (FR-011b). Any unexpected disconnect without a terminal event
 * is surfaced as a failure with reason 'upstream-error' (contracts/api.md).
 */
export function openStream(sessionId: string, handlers: StreamHandlers): () => void {
  const source = new EventSource(apiUrl(`/api/specifications/${sessionId}/stream`));
  let terminal = false;

  const finish = () => {
    terminal = true;
    source.close();
  };

  source.addEventListener('stage-started', (event) => {
    const { stage } = JSON.parse((event as MessageEvent).data) as { stage: GenerationStage };
    handlers.onStageStarted(stage);
  });
  source.addEventListener('stage-completed', (event) => {
    const { stage } = JSON.parse((event as MessageEvent).data) as { stage: GenerationStage };
    handlers.onStageCompleted(stage);
  });
  source.addEventListener('generation-succeeded', (event) => {
    const { specification } = JSON.parse((event as MessageEvent).data) as {
      specification: Specification;
    };
    finish();
    handlers.onSucceeded(specification);
  });
  source.addEventListener('generation-failed', (event) => {
    const { reason } = JSON.parse((event as MessageEvent).data) as {
      reason: GenerationFailureReason;
    };
    finish();
    handlers.onFailed(reason);
  });
  source.onerror = () => {
    // EventSource fires 'error' on any disconnect, including the normal close after a terminal
    // event. Only an error BEFORE a terminal event is an unexpected drop → treat as failure.
    if (!terminal) {
      finish();
      handlers.onFailed('upstream-error');
    }
  };

  return () => {
    terminal = true;
    source.close();
  };
}
