import { asText, requestJson } from './agentSupport';
import type { UserStory } from '../models/specification.types';

// Stage 3 — "creating user stories" (T017). Produces user stories that reference the roles
// identified in stage 1 (the roles are passed in as context).

export interface UserStoriesResult {
  userStories: UserStory[];
}

const SYSTEM_PROMPT =
  'You are a product manager writing user stories. Respond with ONLY a valid JSON object ' +
  'and no surrounding prose or code fences.';

export async function generateUserStories(
  ideaText: string,
  userRoles: string[],
  opts: { signal?: AbortSignal },
): Promise<UserStoriesResult> {
  const userPrompt =
    'From the software idea below, return a JSON object with a "userStories" key: an array ' +
    'of objects, each with "title" (short), "narrative" ("As a <role>, I want <goal>, so ' +
    'that <benefit>"), and "role" (one of the known roles). Prefer these roles where they ' +
    `fit: ${JSON.stringify(userRoles)}.\n\nIdea:\n"""${ideaText}"""`;

  const data = await requestJson<{ userStories?: unknown }>(SYSTEM_PROMPT, userPrompt, opts);
  if (!Array.isArray(data.userStories) || data.userStories.length === 0) {
    throw new Error('Model response field "userStories" has no usable entries.');
  }

  const fallbackRole = userRoles[0] ?? 'User';
  const userStories: UserStory[] = data.userStories.map((raw, index) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    return {
      title: asText(entry.title, `userStories[${index}].title`),
      narrative: asText(entry.narrative, `userStories[${index}].narrative`),
      role:
        typeof entry.role === 'string' && entry.role.trim() !== ''
          ? entry.role.trim()
          : fallbackRole,
    };
  });

  return { userStories };
}
