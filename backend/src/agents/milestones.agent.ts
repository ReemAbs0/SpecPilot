import { asText, requestJson } from './agentSupport';
import type { Milestone } from '../models/specification.types';

// Stage 4 — "preparing milestones" (T018). Produces ordered development milestones.

export interface MilestonesResult {
  milestones: Milestone[];
}

const SYSTEM_PROMPT =
  'You are a delivery lead planning a project. Respond with ONLY a valid JSON object and ' +
  'no surrounding prose or code fences.';

export async function planMilestones(
  ideaText: string,
  opts: { signal?: AbortSignal },
): Promise<MilestonesResult> {
  const userPrompt =
    'From the software idea below, return a JSON object with a "milestones" key: an ordered ' +
    'array of objects, each with "name" and "description". List them in delivery order.\n\n' +
    `Idea:\n"""${ideaText}"""`;

  const data = await requestJson<{ milestones?: unknown }>(SYSTEM_PROMPT, userPrompt, opts);
  if (!Array.isArray(data.milestones) || data.milestones.length === 0) {
    throw new Error('Model response field "milestones" has no usable entries.');
  }

  const milestones: Milestone[] = data.milestones.map((raw, index) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    return {
      name: asText(entry.name, `milestones[${index}].name`),
      description: asText(entry.description, `milestones[${index}].description`),
      // Order is authoritative from the array position, so it is always sequential.
      order: index + 1,
    };
  });

  return { milestones };
}
