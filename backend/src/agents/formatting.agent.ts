import { asTextArray, requestJson } from './agentSupport';
import {
  JSON_ONLY,
  QUALITY_RULES,
  assessComplexity,
  contextBlock,
  range,
  scopeBrief,
} from './promptSupport';
import type { Milestone, Specification, UserStory } from '../models/specification.types';

// Stage 5 — "formatting the final document" (T019). Produces the technical-considerations
// section, then assembles all prior stage outputs into one complete Specification and
// validates that every section is present and non-empty. Any gap fails the session
// (upstream-error, per data-model.md / FR-013), rather than returning a partial result.

const SYSTEM_PROMPT =
  'You are a software architect closing out a specification. You write the technical section a ' +
  'team uses to start building: named technology choices with the reasoning behind them, the ' +
  'trade-offs accepted, and the risks that could derail delivery. ' +
  JSON_ONLY;

// The dimensions an architecture section is expected to address.
const TECHNICAL_COVERAGE = [
  "Architecture — the overall style (monolith, modular services, event-driven) and why it fits this system's scale and team",
  'Frontend — framework, rendering approach, state management, and how the UI meets the accessibility target',
  'Backend — language/runtime, framework, API style (REST, GraphQL, RPC), versioning and error contract',
  'Data — datastore choice, the core entities and their relationships, indexing for the heaviest queries, migrations',
  'Authentication & authorisation — identity provider, session/token strategy, how the role model is enforced server-side',
  'Integrations — each external service the idea needs, what it is used for, and the fallback when it is unavailable',
  'Asynchronous work — background jobs, queues, scheduled tasks, real-time transport where the product needs it',
  'Performance & scaling — caching layers, pagination, the expected bottleneck and the first scaling move against it',
  'Infrastructure & deployment — hosting, environments, CI/CD, configuration and secret management',
  'Observability — logging, metrics, tracing, error reporting, and the alerts that matter',
  'Testing strategy — the layers of the test pyramid, what each covers, and the quality gates in CI',
  'Risks, constraints and open questions — the decisions that need a stakeholder answer before or during build',
]
  .map((item) => `  - ${item}`)
  .join('\n');

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
  const profile = assessComplexity(ideaText);

  const userPrompt =
    contextBlock(draft) +
    'Write the technical-considerations section for the software idea below.\n\n' +
    `${scopeBrief(profile)}\n\n` +
    'Return a JSON object with a "technicalConsiderations" key: an array of ' +
    `${range(profile.technicalConsiderations, 'strings')}, each formatted ` +
    '"<Dimension>: <the decision or consideration, with the reasoning or trade-off behind it>." ' +
    'Commit to specific technologies, patterns and numbers rather than listing options — where a ' +
    'genuine alternative exists, name the one you would pick and say what it costs. Every choice ' +
    'must be justified by something in the requirements above, not by general popularity. Cover ' +
    `the dimensions this product actually needs:\n${TECHNICAL_COVERAGE}\n\n` +
    `Rules:\n${QUALITY_RULES}\n\n` +
    `Idea:\n"""${ideaText}"""`;

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
