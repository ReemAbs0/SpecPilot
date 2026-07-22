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

// Field names commonly used by the model for a short label vs. the descriptive body when it
// returns an array of objects instead of an array of strings.
const LABEL_KEYS = ['title', 'name', 'category', 'area', 'label'];
const BODY_KEYS = [
  'description',
  'detail',
  'details',
  'text',
  'value',
  'consideration',
  'requirement',
  'summary',
];

/**
 * Coerces a single list entry to a readable string. Real models frequently return an array of
 * objects (e.g. { category, description }) where the schema asked for strings; this flattens
 * such objects to "Label: Description" (or the best available text) so a well-formed—but
 * differently-shaped—response is still usable rather than a hard failure.
 */
function coerceToText(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (typeof item === 'number' || typeof item === 'boolean') return String(item);
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const pick = (keys: string[]) =>
      keys.map((k) => obj[k]).find((v) => typeof v === 'string' && v.trim() !== '') as
        string | undefined;
    const label = pick(LABEL_KEYS);
    const body = pick(BODY_KEYS);
    if (label && body) return `${label.trim()}: ${body.trim()}`;
    if (body) return body.trim();
    if (label) return label.trim();
    const strings = Object.values(obj)
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
      .map((v) => v.trim());
    if (strings.length) return strings.join(' — ');
  }
  return '';
}

/**
 * Asserts a value is a non-empty array and returns it as non-empty strings. Tolerates entries
 * the model returns as objects by flattening them (see coerceToText).
 */
export function asTextArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Model response field "${field}" is not an array.`);
  }
  const items = value.map(coerceToText).filter((item) => item !== '');
  if (items.length === 0) {
    throw new Error(`Model response field "${field}" has no usable entries.`);
  }
  return items;
}
