import { asTextArray, requestJson } from './agentSupport';
import type { Milestone, Specification, UserStory } from '../models/specification.types';

// Stage 5 — "formatting the final document" (T019). Produces the technical-considerations
// section, then assembles all prior stage outputs into one complete Specification and
// validates that every section is present and non-empty. Any gap fails the session
// (upstream-error, per data-model.md / FR-013), rather than returning a partial result.

const SYSTEM_PROMPT =
  'You are a software architect finalizing a specification. Respond with ONLY a valid JSON ' +
  'object and no surrounding prose or code fences.';

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Assembled specification is missing "${field}".`);
  }
  return value.trim();
}

function requireArray<T>(value: T[] | undefined, field: string): T[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Assembled specification is missing "${field}".`);
  }
  return value;
}

export async function formatSpecification(
  ideaText: string,
  draft: Partial<Specification>,
  opts: { signal?: AbortSignal },
): Promise<Specification> {
  const userPrompt =
    'From the software idea below, return a JSON object with a "technicalConsiderations" ' +
    'key: an array of notable technical considerations (architecture, data, integrations, ' +
    `constraints).\n\nIdea:\n"""${ideaText}"""`;

  const data = await requestJson<Record<string, unknown>>(SYSTEM_PROMPT, userPrompt, opts);
  const technicalConsiderations = asTextArray(
    data.technicalConsiderations,
    'technicalConsiderations',
  );

  // Assemble and validate every section (title + the eight required sections).
  const specification: Specification = {
    title: requireText(draft.title, 'title'),
    projectSummary: requireText(draft.projectSummary, 'projectSummary'),
    targetUsers: requireText(draft.targetUsers, 'targetUsers'),
    userRoles: requireArray<string>(draft.userRoles, 'userRoles'),
    functionalRequirements: requireArray<string>(
      draft.functionalRequirements,
      'functionalRequirements',
    ),
    nonFunctionalRequirements: requireArray<string>(
      draft.nonFunctionalRequirements,
      'nonFunctionalRequirements',
    ),
    userStories: requireArray<UserStory>(draft.userStories, 'userStories'),
    milestones: requireArray<Milestone>(draft.milestones, 'milestones'),
    technicalConsiderations,
  };

  return specification;
}
