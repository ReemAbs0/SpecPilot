// Thin HTTP client for the Fetch.ai / ASI:One hosted inference endpoint (research.md #1).
// All configuration comes from environment variables — no secrets or endpoints are
// hardcoded (project constitution: Environment). The agent-stage modules (T015–T019) call
// `requestCompletion` to turn a prompt into text; the orchestrator passes an AbortSignal so
// a stage can be aborted on cancellation (FR-011b) or timeout (FR-011a).

/** A single chat message sent to the hosted model. */
export interface FetchAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Raised when the hosted endpoint is unreachable or returns an unusable response. */
export class FetchAiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FetchAiError';
  }
}

interface FetchAiConfig {
  apiKey: string;
  endpointUrl: string;
  model: string;
}

/**
 * Reads and validates client configuration from the environment at call time (not module
 * load) so tests can set env vars and dotenv is loaded first by the server entrypoint.
 * Throws FetchAiError with a clear message if a required variable is missing.
 */
function getConfig(): FetchAiConfig {
  const apiKey = process.env.FETCH_AI_API_KEY;
  const endpointUrl = process.env.FETCH_AI_ENDPOINT_URL;
  const model = process.env.FETCH_AI_MODEL ?? 'asi1-mini';

  if (!apiKey) {
    throw new FetchAiError('FETCH_AI_API_KEY is not set.');
  }
  if (!endpointUrl) {
    throw new FetchAiError('FETCH_AI_ENDPOINT_URL is not set.');
  }
  return { apiKey, endpointUrl, model };
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Sends a chat-completion request to the hosted endpoint and returns the assistant's text.
 *
 * Note: intentionally does not log request or response bodies — idea text and generated
 * content must never reach logs (FR-017). An aborted `signal` causes the underlying fetch
 * to reject with an AbortError, which propagates to the caller (the orchestrator maps that
 * to cancellation/timeout rather than an upstream error).
 */
export async function requestCompletion(
  messages: FetchAiMessage[],
  options: { signal?: AbortSignal } = {},
): Promise<string> {
  const { apiKey, endpointUrl, model } = getConfig();
  const url = `${endpointUrl.replace(/\/$/, '')}/chat/completions`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
      signal: options.signal,
    });
  } catch (error) {
    // Let abort errors propagate untouched so the orchestrator can distinguish them.
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new FetchAiError('Failed to reach the Fetch.ai endpoint.');
  }

  if (!response.ok) {
    throw new FetchAiError(`Fetch.ai endpoint returned status ${response.status}.`);
  }

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch {
    throw new FetchAiError('Fetch.ai endpoint returned a non-JSON response.');
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new FetchAiError('Fetch.ai endpoint returned an empty completion.');
  }
  return content;
}
