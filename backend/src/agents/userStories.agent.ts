import { asText, requestJson, toShortLabel } from './agentSupport';
import {
  JSON_ONLY,
  QUALITY_RULES,
  assessComplexity,
  contextBlock,
  range,
  scopeBrief,
} from './promptSupport';
import type { Specification, UserStory } from '../models/specification.types';

// Stage 3 — "creating user stories" (T017). Produces user stories that reference the roles
// identified in stage 1 and the requirements written in stage 2 (both passed in as context).
//
// Acceptance criteria: the stored UserStory shape is unchanged ({ title, narrative, role }), so
// criteria are requested as a separate array and folded into the narrative below. That keeps the
// persisted/serialised schema identical while still getting testable criteria into the document.

export interface UserStoriesResult {
  userStories: UserStory[];
}

const SYSTEM_PROMPT =
  'You are a product manager writing the user-story backlog for a software specification. Your ' +
  'stories are the ones a team estimates and QA writes test cases from: each has a real user ' +
  'goal and acceptance criteria precise enough to argue about. ' +
  JSON_ONLY;

// What the backlog has to span. Without this, models return only happy-path stories for the
// single most obvious role.
const STORY_COVERAGE = [
  'every role listed above gets stories proportional to how much it uses the system — no role is left with one token story',
  'the primary end-to-end workflow, split into the separate steps a user actually performs',
  'onboarding and first-run: signing up, being invited, configuring the account, the empty state',
  'secondary but expected workflows: editing, cancelling, searching, exporting, notification preferences',
  'edge cases and failure paths: conflicting or concurrent actions, invalid input, expired or revoked access, an integration being down, recovering from a mistake',
  'administrative and operational stories: configuring the system, managing users and permissions, moderating content, investigating an issue reported by a user',
  'where the domain implies them: reporting, auditing, and compliance stories',
]
  .map((item) => `  - ${item}`)
  .join('\n');

/**
 * Keeps a story's role a short chip that matches the specification's role list: strips any
 * description the model appended, then snaps it to the canonical spelling of a known role.
 */
function normaliseRole(raw: unknown, userRoles: string[], fallback: string): string {
  if (typeof raw !== 'string' || raw.trim() === '') return fallback;
  const label = toShortLabel(raw);
  if (label === '') return fallback;
  const known = userRoles.find((role) => role.toLowerCase() === label.toLowerCase());
  return known ?? label;
}

/** Renders the model's acceptance-criteria array into the narrative string. */
function appendAcceptanceCriteria(narrative: string, raw: unknown): string {
  if (!Array.isArray(raw)) return narrative;
  const criteria = raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '');
  if (criteria.length === 0) return narrative;
  return `${narrative}\n\nAcceptance Criteria:\n${criteria.map((c) => `- ${c}`).join('\n')}`;
}

export async function generateUserStories(
  ideaText: string,
  draft: Partial<Specification>,
  opts: { signal?: AbortSignal },
): Promise<UserStoriesResult> {
  const profile = assessComplexity(ideaText);
  const userRoles = draft.userRoles ?? [];

  const userPrompt =
    contextBlock(draft) +
    'Write the user-story backlog for the software idea below.\n\n' +
    `${scopeBrief(profile)}\n\n` +
    `Return a JSON object with a "userStories" key: an array of ${range(profile.userStories, 'objects')}, ` +
    'each with exactly these keys:\n\n' +
    '- "title": a short imperative feature name, e.g. "Reschedule a confirmed booking". Not a ' +
    'restatement of the narrative.\n' +
    '- "narrative": "As a <role>, I want <specific goal>, so that <concrete benefit>." The goal ' +
    'must be one discrete capability — if it needs an "and", it is two stories.\n' +
    `- "role": exactly one of ${JSON.stringify(userRoles)}${userRoles.length ? '' : ' (the roles above)'}, ` +
    'spelled identically.\n' +
    `- "acceptanceCriteria": an array of ${range(profile.acceptanceCriteria, 'strings')} in ` +
    '"Given <precondition>, when <action>, then <observable outcome>" form. Include at least one ' +
    'negative, error or boundary case per story — permission denied, validation failure, conflict, ' +
    'empty state, or limit reached. Reference real field names, states and numbers, so each ' +
    'criterion is directly translatable into a test case.\n\n' +
    'Backlog coverage — group the stories by role, and make sure the set spans:\n' +
    `${STORY_COVERAGE}\n\n` +
    'Each story must trace back to at least one functional requirement above; between them the ' +
    'stories should cover the significant requirements. Two stories that a developer would ' +
    'implement with the same code are one story — merge them.\n\n' +
    `Rules:\n${QUALITY_RULES}\n\n` +
    `Idea:\n"""${ideaText}"""`;

  const data = await requestJson<{ userStories?: unknown }>(SYSTEM_PROMPT, userPrompt, opts);
  if (!Array.isArray(data.userStories) || data.userStories.length === 0) {
    throw new Error('Model response field "userStories" has no usable entries.');
  }

  const fallbackRole = userRoles[0] ?? 'User';
  const userStories: UserStory[] = data.userStories.map((raw, index) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    return {
      title: asText(entry.title, `userStories[${index}].title`),
      narrative: appendAcceptanceCriteria(
        asText(entry.narrative, `userStories[${index}].narrative`),
        entry.acceptanceCriteria,
      ),
      role: normaliseRole(entry.role, userRoles, fallbackRole),
    };
  });

  return { userStories };
}
