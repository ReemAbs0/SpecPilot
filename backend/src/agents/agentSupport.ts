import { requestCompletion, type FetchAiMessage } from '../services/fetchAiClient';

// Shared helpers for the agent-stage modules (T015–T019). Each agent asks the hosted model
// for JSON and validates the fields it needs; malformed output throws, which the
// orchestrator maps to an 'upstream-error' failure (FR-011).

/**
 * Sends a system+user prompt to the model and parses the reply as a JSON object.
 *
 * One retry: the stages ask for long, densely-structured sections, and at that length an
 * occasional malformed reply or transient upstream hiccup is expected. Retrying the single
 * stage costs seconds; not retrying costs the whole generation. Aborts (cancellation and
 * timeout, FR-011a/FR-011b) are never retried — they propagate immediately.
 */
export async function requestJson<T>(
  systemPrompt: string,
  userPrompt: string,
  opts: { signal?: AbortSignal },
): Promise<T> {
  const messages: FetchAiMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    return parseJsonObject<T>(await requestCompletion(messages, opts));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    opts.signal?.throwIfAborted();
    const retryMessages: FetchAiMessage[] = [
      ...messages,
      {
        role: 'user',
        content:
          'Your previous reply could not be used. Send the same content again as ONE complete, ' +
          'valid JSON object: no prose, no code fences, all strings closed, and short enough to ' +
          'finish within the token limit.',
      },
    ];
    return parseJsonObject<T>(await requestCompletion(retryMessages, opts));
  }
}

/** Extracts and parses the first JSON object from model output (tolerating code fences/prose). */
export function parseJsonObject<T>(raw: string): T {
  const withoutFences = raw.replace(/```(?:json)?/gi, '').trim();
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    // A reply that opens an object but never closes it is the signature of hitting the token
    // ceiling — worth distinguishing, since the sections are long enough for that to happen.
    if (start !== -1) {
      throw new Error(
        'Model response was cut off before the JSON object closed (raise FETCH_AI_MAX_TOKENS).',
      );
    }
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
 * Reduces "Admin: manages billing and users" to "Admin". Only strips a prefix short enough to be
 * a label, so a value that legitimately contains a colon is left alone.
 */
export function toShortLabel(value: string): string {
  const prefixed = /^([^:]{2,40}):\s+\S/.exec(value.trim());
  return (prefixed ? prefixed[1] : value).trim().replace(/[.,;]+$/, '');
}

/**
 * Like asTextArray, but for fields that must stay short labels (user roles, rendered as chips).
 * Models routinely answer with `{ role, description }` objects or `"Admin: manages everything"`
 * strings; both are reduced to just the label here, and duplicates are dropped.
 */
export function asLabelArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Model response field "${field}" is not an array.`);
  }
  const labels: string[] = [];
  for (const item of value) {
    let label = '';
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const named = ['role', ...LABEL_KEYS]
        .map((key) => obj[key])
        .find((v) => typeof v === 'string' && v.trim() !== '');
      label = typeof named === 'string' ? named : coerceToText(item);
    } else {
      label = coerceToText(item);
    }
    label = toShortLabel(label);
    if (
      label !== '' &&
      !labels.some((existing) => existing.toLowerCase() === label.toLowerCase())
    ) {
      labels.push(label);
    }
  }
  if (labels.length === 0) {
    throw new Error(`Model response field "${field}" has no usable entries.`);
  }
  return labels;
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
