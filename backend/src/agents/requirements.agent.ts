import { asTextArray, requestJson } from './agentSupport';

// Stage 2 — "generating requirements" (T016). Produces the functional and non-functional
// requirements for the specification.

export interface RequirementsResult {
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
}

const SYSTEM_PROMPT =
  'You are a senior software analyst writing requirements. Respond with ONLY a valid JSON ' +
  'object and no surrounding prose or code fences.';

export async function generateRequirements(
  ideaText: string,
  opts: { signal?: AbortSignal },
): Promise<RequirementsResult> {
  const userPrompt =
    'From the software idea below, return a JSON object with these keys:\n' +
    '- "functionalRequirements": an array of clear, testable functional requirements.\n' +
    '- "nonFunctionalRequirements": an array of non-functional requirements ' +
    '(performance, security, accessibility, reliability, etc.).\n\n' +
    `Idea:\n"""${ideaText}"""`;

  const data = await requestJson<Record<string, unknown>>(SYSTEM_PROMPT, userPrompt, opts);
  return {
    functionalRequirements: asTextArray(data.functionalRequirements, 'functionalRequirements'),
    nonFunctionalRequirements: asTextArray(
      data.nonFunctionalRequirements,
      'nonFunctionalRequirements',
    ),
  };
}
