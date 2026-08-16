import type { Specification } from '../models/specification.types';

// Shared prompt material for the five agent stages. Everything here shapes *what the model is
// asked for* — the JSON schema each stage returns is unchanged (see specification.types.ts).
//
// Three concerns live here:
//   1. QUALITY_RULES  — the house style every stage enforces (specific, verifiable, non-repetitive).
//   2. Complexity     — a cheap, deterministic read of how large the idea is, so a to-do list gets
//                       a short specification and a multi-tenant marketplace gets a long one, and
//                       every stage scales *consistently* (they each judge the same idea text).
//   3. contextBlock   — renders earlier-stage output as context for later stages, so sections
//                       reference the same roles/entities instead of drifting apart.

/** House style applied to every stage. Kept short so it survives in the model's attention. */
export const QUALITY_RULES = [
  'Write as an experienced software analyst producing a document a delivery team could build from.',
  'Be specific to THIS product: name the actual entities, screens, states, and business rules the',
  '  idea implies. Reject anything that would read the same for an unrelated app.',
  'Every item must add information no other item carries — no duplicates, no rephrasings, no',
  '  splitting one thought across two entries to inflate the count.',
  'Prefer concrete and verifiable over adjectives: "search results return within 2s for 95% of',
  '  queries over 100k records", not "search is fast".',
  'Where the idea is silent on something the section needs, make a sensible industry-standard',
  '  assumption and state it inside the item rather than writing something vague.',
  'Do not restate the idea back, do not add meta-commentary, and do not mention these rules.',
]
  .map((line) => (line.startsWith('  ') ? line : `- ${line}`))
  .join('\n');

/** Instruction repeated in every system prompt — the parser only accepts a bare JSON object. */
export const JSON_ONLY =
  'Respond with ONLY a single valid JSON object. No prose, no code fences, no trailing commentary. ' +
  'Use plain double-quoted strings; escape newlines inside strings as \\n.';

export type ComplexityTier = 'simple' | 'moderate' | 'complex';

/** Per-tier target ranges. These are targets the model may exceed when the idea warrants it. */
export interface ComplexityProfile {
  tier: ComplexityTier;
  summary: string;
  functionalRequirements: [number, number];
  nonFunctionalRequirements: [number, number];
  userStories: [number, number];
  acceptanceCriteria: [number, number];
  milestones: [number, number];
  technicalConsiderations: [number, number];
  userRoles: [number, number];
}

const PROFILES: Record<ComplexityTier, ComplexityProfile> = {
  simple: {
    tier: 'simple',
    summary: 'one paragraph of roughly 100-150 words',
    functionalRequirements: [8, 12],
    nonFunctionalRequirements: [6, 9],
    userStories: [7, 10],
    acceptanceCriteria: [2, 4],
    milestones: [3, 4],
    technicalConsiderations: [5, 8],
    userRoles: [1, 3],
  },
  moderate: {
    tier: 'moderate',
    summary: 'two paragraphs of roughly 180-260 words total',
    functionalRequirements: [14, 20],
    nonFunctionalRequirements: [10, 14],
    userStories: [14, 20],
    acceptanceCriteria: [3, 5],
    milestones: [4, 6],
    technicalConsiderations: [8, 12],
    userRoles: [3, 5],
  },
  complex: {
    tier: 'complex',
    summary: 'three paragraphs of roughly 280-380 words total',
    functionalRequirements: [22, 30],
    nonFunctionalRequirements: [14, 18],
    userStories: [20, 26],
    acceptanceCriteria: [3, 5],
    milestones: [6, 8],
    technicalConsiderations: [12, 16],
    userRoles: [4, 7],
  },
};

/**
 * Capability areas that reliably signal scope. Each area counts once no matter how many of its
 * words appear, so "payment, payments, billing" is one signal rather than three.
 */
const CAPABILITY_SIGNALS: RegExp[] = [
  /\b(sign[ -]?up|sign[ -]?in|log[ -]?in|account|authentication|auth|sso|oauth|password)\b/i,
  /\b(admin|administrator|moderator|manager|staff|role|roles|permission|teacher|student|doctor|patient|driver|seller|buyer|vendor|employee)\b/i,
  /\b(pay|paid|payment|payments|checkout|billing|invoice|subscription|stripe|paypal|refund|pricing|wallet|payout)\b/i,
  /\b(real[ -]?time|live|tracking|gps|websocket|streaming|chat|messaging|notification|notifications|alerts)\b/i,
  /\b(integration|integrations|integrate|api|webhook|third[ -]party|import|export|sync|erp|crm)\b/i,
  /\b(analytic|analytics|report|reports|reporting|dashboard|metric|metrics|insight|insights|statistics|forecast)\b/i,
  /\b(upload|uploads|media|image|images|video|videos|document|documents|attachment|file storage)\b/i,
  /\b(schedule|scheduling|booking|bookings|reservation|appointment|calendar|shift|availability)\b/i,
  /\b(search|filter|filtering|recommend|recommendation|ranking|matching|discovery)\b/i,
  /\b(mobile|ios|android|offline|push notification|native app|responsive)\b/i,
  /\b(gdpr|hipaa|pci|soc ?2|compliance|audit|audit log|regulation|regulatory|encryption|privacy)\b/i,
  /\b(machine learning|ml model|llm|nlp|prediction|predictive|recommendation engine|artificial intelligence)\b/i,
  /\b(marketplace|multi[ -]tenant|tenant|organization|organisations|organizations|workspace|team|teams|b2b)\b/i,
  /\b(workflow|approval|approvals|review process|state machine|pipeline|automation|escalation)\b/i,
  /\b(inventory|stock|order|orders|shipping|logistics|delivery|warehouse|fulfilment|fulfillment)\b/i,
  /\b(localization|localisation|multi[ -]language|i18n|translation|currency|timezone)\b/i,
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Scores an idea's scope from its length and how many distinct capability areas it touches.
 * Deliberately conservative and deterministic: it costs no extra model call, and because every
 * stage runs it on the same idea text, all sections scale to the same tier. The prompts present
 * the result as a target, not a cap, so the model can still go bigger on a dense short idea.
 */
export function assessComplexity(ideaText: string): ComplexityProfile {
  const words = wordCount(ideaText);
  const lengthScore = words < 40 ? 0 : words < 100 ? 2 : words < 200 ? 3 : 4;
  const signalScore = CAPABILITY_SIGNALS.filter((pattern) => pattern.test(ideaText)).length;
  const total = lengthScore + signalScore;

  // Four distinct capability areas (say: accounts, payments, scheduling, admin) already describes
  // a system too big for a short specification, so the simple band is deliberately narrow.
  if (total <= 3) return PROFILES.simple;
  if (total <= 9) return PROFILES.moderate;
  return PROFILES.complex;
}

/** "roughly 14-20 items" — the phrasing used to hand a target range to the model. */
export function range([lo, hi]: [number, number], noun: string): string {
  return `roughly ${lo}-${hi} ${noun}`;
}

/** One-line scope framing prepended to each stage's instructions. */
export function scopeBrief(profile: ComplexityProfile): string {
  return (
    `Scope calibration: this idea reads as a ${profile.tier} product. Treat the counts below as ` +
    'targets, not quotas — go above them if the idea is genuinely richer than it looks, and stay ' +
    'below them rather than padding a genuinely small idea with invented scope.'
  );
}

/** Caps a list rendered into a prompt so context stays bounded on very large specifications. */
function bullets(items: string[], limit: number): string {
  return items
    .slice(0, limit)
    .map((item) => `  - ${item}`)
    .join('\n');
}

/**
 * Renders the draft produced by earlier stages as prompt context. Later stages use it to reuse
 * the same roles, entities and terminology instead of re-deriving them from the idea text — the
 * main cause of sections that contradict or repeat each other.
 */
export function contextBlock(draft: Partial<Specification>): string {
  const parts: string[] = [];
  if (draft.title) parts.push(`Working title: ${draft.title}`);
  if (draft.projectSummary) parts.push(`Project summary:\n${draft.projectSummary}`);
  if (draft.targetUsers) parts.push(`Target users: ${draft.targetUsers}`);
  if (draft.userRoles?.length) parts.push(`User roles: ${draft.userRoles.join(', ')}`);
  if (draft.functionalRequirements?.length) {
    parts.push(
      `Functional requirements already written:\n${bullets(draft.functionalRequirements, 30)}`,
    );
  }
  if (draft.nonFunctionalRequirements?.length) {
    parts.push(
      `Non-functional requirements already written:\n${bullets(draft.nonFunctionalRequirements, 20)}`,
    );
  }
  if (draft.userStories?.length) {
    parts.push(
      `User story titles already written:\n${bullets(
        draft.userStories.map((s) => s.title),
        30,
      )}`,
    );
  }
  if (parts.length === 0) return '';
  return (
    'Context from earlier stages of this same specification — reuse its terminology, roles and ' +
    'entity names exactly, and do not contradict or restate it:\n\n' +
    parts.join('\n\n') +
    '\n\n'
  );
}
