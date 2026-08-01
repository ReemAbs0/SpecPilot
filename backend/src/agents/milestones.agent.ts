import { asText, requestJson } from './agentSupport';
import {
  JSON_ONLY,
  QUALITY_RULES,
  assessComplexity,
  contextBlock,
  range,
  scopeBrief,
} from './promptSupport';
import type { Milestone, Specification } from '../models/specification.types';

// Stage 4 — "preparing milestones" (T018). Produces ordered development phases, planned against
// the requirements and stories the earlier stages produced (passed in as context) rather than
// against the raw idea, so the phases actually schedule the scope in this document.
//
// The stored Milestone shape is unchanged ({ name, description, order }); the richer material the
// prompt asks for (deliverables, exit criteria) is folded into `description` below.

export interface MilestonesResult {
  milestones: Milestone[];
}

const SYSTEM_PROMPT =
  'You are a delivery lead breaking a specification into development phases. You plan in ' +
  'vertically-sliced, demonstrable increments: every phase ends with something a stakeholder can ' +
  'see working, and foundations are built only far enough to support the slice that needs them. ' +
  JSON_ONLY;

/** Folds the model's supporting arrays into the single description string the schema stores. */
function composeDescription(entry: Record<string, unknown>, index: number): string {
  const parts = [asText(entry.description, `milestones[${index}].description`)];

  const list = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.map((v) => (typeof v === 'string' ? v.trim() : '')).filter((v) => v !== '')
      : [];

  const deliverables = list(entry.deliverables);
  if (deliverables.length) {
    parts.push(`Deliverables:\n${deliverables.map((d) => `- ${d}`).join('\n')}`);
  }
  const exitCriteria = list(entry.exitCriteria);
  if (exitCriteria.length) {
    parts.push(`Exit criteria:\n${exitCriteria.map((c) => `- ${c}`).join('\n')}`);
  }
  if (typeof entry.duration === 'string' && entry.duration.trim() !== '') {
    parts.push(`Estimated duration: ${entry.duration.trim()}`);
  }
  return parts.join('\n\n');
}

export async function planMilestones(
  ideaText: string,
  draft: Partial<Specification>,
  opts: { signal?: AbortSignal },
): Promise<MilestonesResult> {
  const profile = assessComplexity(ideaText);

  const userPrompt =
    contextBlock(draft) +
    'Plan the delivery phases for the software idea below.\n\n' +
    `${scopeBrief(profile)}\n\n` +
    `Return a JSON object with a "milestones" key: an ordered array of ${range(profile.milestones, 'objects')} ` +
    'in delivery order, each with exactly these keys:\n\n' +
    '- "name": the phase name and its theme, e.g. "Phase 2 — Booking & Availability". Never a bare ' +
    '"Phase 3" or a generic "Development".\n' +
    '- "description": two to four sentences on what this phase builds, which requirements and user ' +
    'stories from above it satisfies (name them), why it comes at this point in the sequence, and ' +
    'the main technical risk it carries.\n' +
    '- "deliverables": an array of 3-6 concrete artefacts completed in this phase — working ' +
    'features, schemas, endpoints, integrations, environments, test suites, documentation. Each ' +
    'must be something a reviewer could inspect, not an activity like "start on the backend".\n' +
    '- "exitCriteria": an array of 2-4 conditions that must hold before the phase is considered ' +
    'done, stated so they can be verified (a demoable flow, a measured target, a test-coverage or ' +
    'quality gate, a signed-off review).\n' +
    '- "duration": a realistic span for a small team, e.g. "2-3 weeks".\n\n' +
    'Sequencing rules: start with the foundations the first user-visible slice needs (environment, ' +
    'data model, authentication) rather than an abstract "setup" phase; deliver the core workflow ' +
    'end to end before secondary features; place administrative, reporting and integration work ' +
    'where its dependencies are ready; and finish with a hardening-and-launch phase covering ' +
    'performance, security, accessibility and operational readiness. No phase may depend on work ' +
    'scheduled after it.\n\n' +
    `Rules:\n${QUALITY_RULES}\n\n` +
    `Idea:\n"""${ideaText}"""`;

  const data = await requestJson<{ milestones?: unknown }>(SYSTEM_PROMPT, userPrompt, opts);
  if (!Array.isArray(data.milestones) || data.milestones.length === 0) {
    throw new Error('Model response field "milestones" has no usable entries.');
  }

  const milestones: Milestone[] = data.milestones.map((raw, index) => {
    const entry = (raw ?? {}) as Record<string, unknown>;
    return {
      name: asText(entry.name, `milestones[${index}].name`),
      description: composeDescription(entry, index),
      // Order is authoritative from the array position, so it is always sequential.
      order: index + 1,
    };
  });

  return { milestones };
}
