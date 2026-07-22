import { requestCompletion, type FetchAiMessage } from '../services/fetchAiClient';

// Shared helpers for the agent-stage modules (T015–T019). Each agent asks the hosted model
// for JSON and validates the fields it needs; malformed output throws, which the
// orchestrator maps to an 'upstream-error' failure (FR-011).

/** Sends a system+user prompt to the model and parses the reply as a JSON object. */
export async function requestJson<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: { signal?: AbortSignal },
): Promise<T> {
  const messages: FetchAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
  const raw = await requestCompletion(messages, opts);
  return parseJsonObject<T>(raw);
}

/** Extracts and parses the first JSON object from model output (tolerating code fences/prose). */
export function parseJsonObject<T>(raw: string): T {
  const withoutFences = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Model response did not contain a JSON object.');
  }
  try {
    return JSON.parse(withoutFences.slice(start, end + 1)) as T;
  } catch {
    throw new Error('Model response was not valid JSON.');
  }
}

/** Asserts a value is a non-empty string, trimming it. */
export function asText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Model response is missing a non-empty "${field}".`);
  }
  return value.trim();
}

/** Asserts a value is a non-empty array of non-empty strings. */
export function asTextArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Model response field "${field}" is not an array.`);
  }
  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '');
  if (items.length === 0) {
    throw new Error(`Model response field "${field}" has no usable entries.`);
  }
  return items;
}
