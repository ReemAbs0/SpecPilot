import { describe, it, expect } from 'vitest';
import { asTextArray } from '../../src/agents/agentSupport';

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
