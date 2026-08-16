import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/services/fetchAiClient', () => ({
  FetchAiError: class FetchAiError extends Error {},
  requestCompletion: vi.fn(),
}));

import { asLabelArray, asTextArray, requestJson } from '../../src/agents/agentSupport';
import { requestCompletion } from '../../src/services/fetchAiClient';

// Regression coverage: real models (e.g. asi1-mini) often return an array of OBJECTS where the
// schema asked for an array of strings — this must be tolerated, not fail generation.

describe('asTextArray', () => {
  it('passes through an array of plain strings', () => {
    expect(asTextArray(['a', ' b '], 'field')).toEqual(['a', 'b']);
  });

  it('flattens {category, description} objects to "Label: Description"', () => {
    const input = [
      { category: 'Architecture', description: 'Use microservices.' },
      { category: 'Data', description: 'Use PostgreSQL.' },
    ];
    expect(asTextArray(input, 'technicalConsiderations')).toEqual([
      'Architecture: Use microservices.',
      'Data: Use PostgreSQL.',
    ]);
  });

  it('uses the body field alone when there is no label', () => {
    expect(asTextArray([{ description: 'Just a detail.' }], 'field')).toEqual(['Just a detail.']);
  });

  it('throws when the value is not an array', () => {
    expect(() => asTextArray('nope', 'field')).toThrow();
  });

  it('throws when there are no usable entries', () => {
    expect(() => asTextArray([{}, ''], 'field')).toThrow();
  });
});

// Role chips must stay short labels even when the model answers with objects or appended
// descriptions ("Dog Walker: service providers who ...").
describe('asLabelArray', () => {
  it('keeps plain role labels as-is', () => {
    expect(asLabelArray(['Admin', ' Customer '], 'userRoles')).toEqual(['Admin', 'Customer']);
  });

  it('strips an appended description from a label', () => {
    expect(asLabelArray(['Dog Walker: service providers who accept walks.'], 'userRoles')).toEqual([
      'Dog Walker',
    ]);
  });

  it('takes the name from {name, description} objects', () => {
    const input = [{ name: 'Clinic Admin', description: 'Configures the clinic.' }];
    expect(asLabelArray(input, 'userRoles')).toEqual(['Clinic Admin']);
  });

  it('drops case-insensitive duplicates', () => {
    expect(asLabelArray(['Admin', 'admin'], 'userRoles')).toEqual(['Admin']);
  });

  it('throws when no usable label remains', () => {
    expect(() => asLabelArray([], 'userRoles')).toThrow();
  });
});

// Long section replies occasionally come back malformed; one retry saves the generation, but a
// cancellation or timeout must never be retried.
describe('requestJson retry', () => {
  beforeEach(() => {
    vi.mocked(requestCompletion).mockReset();
  });

  it('retries once when the first reply is not parseable JSON', async () => {
    vi.mocked(requestCompletion)
      .mockResolvedValueOnce('sorry, here is a list instead')
      .mockResolvedValueOnce('{"ok":true}');

    await expect(requestJson('sys', 'user', {})).resolves.toEqual({ ok: true });
    expect(requestCompletion).toHaveBeenCalledTimes(2);
  });

  it('surfaces the error when the retry also fails', async () => {
    vi.mocked(requestCompletion).mockResolvedValue('not json');
    await expect(requestJson('sys', 'user', {})).rejects.toThrow();
    expect(requestCompletion).toHaveBeenCalledTimes(2);
  });

  it('does not retry an aborted request', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    vi.mocked(requestCompletion).mockRejectedValue(abortError);

    await expect(requestJson('sys', 'user', {})).rejects.toThrow('Aborted');
    expect(requestCompletion).toHaveBeenCalledTimes(1);
  });
});
