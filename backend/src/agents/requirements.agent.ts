import { asTextArray, requestJson } from './agentSupport';
import {
  JSON_ONLY,
  QUALITY_RULES,
  assessComplexity,
  contextBlock,
  range,
  scopeBrief,
} from './promptSupport';
import type { Specification } from '../models/specification.types';

// Stage 2 — "generating requirements" (T016). Produces the functional and non-functional
// requirements for the specification, using the stage-1 draft (title, summary, roles) as
// context so requirements are written against the roles the rest of the document uses.

export interface RequirementsResult {
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
}

const SYSTEM_PROMPT =
  'You are a senior software analyst writing the requirements section of a specification that ' +
  'will be handed to an engineering team and to QA. Every requirement you write must be ' +
  'individually testable — a tester should be able to read one line and know how to prove it. ' +
  JSON_ONLY;

// The capability areas a functional-requirements section is expected to cover. Listing them
// explicitly is what stops the model from writing five requirements about the happy path and
// nothing about permissions, validation, or data lifecycle.
const FUNCTIONAL_COVERAGE = [
  'account lifecycle: registration, authentication, session handling, profile management',
  'role-based access: what each role in the context above may and may not do',
  'the core domain workflow, broken into its individual user-facing steps',
  'full lifecycle of the primary entities: create, read, update, delete/archive, and their states',
  'listing, searching, filtering and sorting wherever collections of data are shown',
  'input validation and error handling, including what the user sees when an action fails',
  'notifications and messaging the system sends, with their triggers and channels',
  'administrative and operational functions: configuration, moderation, support intervention',
  'reporting or data export, where the audience needs to get data out of the system',
  'integrations with external services the idea implies, including failure behaviour',
  'data lifecycle: retention, archival, deletion, and audit history where it matters',
]
  .map((item) => `  - ${item}`)
  .join('\n');

// Named NFR categories, each with the kind of measurement it must carry.
const NON_FUNCTIONAL_COVERAGE = [
  'Performance — latency and throughput targets at a stated percentile and load',
  'Scalability — the concurrency, data volume and growth the system must absorb, and how',
  'Security — authentication strength, authorisation model, encryption in transit and at rest, secret handling, common-attack defences',
  'Privacy & Compliance — personal-data handling, consent, retention, and any regime the domain implies (GDPR, HIPAA, PCI DSS)',
  'Reliability & Availability — uptime target, recovery objectives (RTO/RPO), backup and degradation behaviour',
  'Accessibility — a named conformance target (e.g. WCAG 2.2 AA) and the specific obligations it creates: keyboard operation, screen-reader semantics, contrast, focus handling',
  'Usability — task-completion expectations, learnability, error recovery, responsive/mobile behaviour',
  'Maintainability — code and test standards, documentation, deployment cadence',
  'Observability — logging, metrics, tracing, alerting and their retention',
  'Compatibility — supported browsers, devices, OS versions, or API versioning policy',
  'Localization — languages, currencies, time zones and formats, where the audience needs them',
]
  .map((item) => `  - ${item}`)
  .join('\n');

export async function generateRequirements(
  ideaText: string,
  draft: Partial<Specification>,
  opts: { signal?: AbortSignal },
): Promise<RequirementsResult> {
  const profile = assessComplexity(ideaText);

  const userPrompt =
    contextBlock(draft) +
    'Write the requirements sections for the software idea below.\n\n' +
    `${scopeBrief(profile)}\n\n` +
    'Return a JSON object with exactly these keys:\n\n' +
    `- "functionalRequirements": an array of ${range(profile.functionalRequirements, 'strings')}. ` +
    'Format each one as "<Capability Area>: The system MUST <observable behaviour>." — for example ' +
    '"Booking Management: The system MUST prevent a customer from confirming a slot that another ' +
    'booking already holds, showing the next three available slots instead." Order them by ' +
    'capability area so related requirements sit together. Name the role that performs the action ' +
    'whenever it is role-specific. Work through this coverage checklist and write requirements for ' +
    `every area the idea actually needs, skipping only the ones it genuinely does not:\n${FUNCTIONAL_COVERAGE}\n\n` +
    `- "nonFunctionalRequirements": an array of ${range(profile.nonFunctionalRequirements, 'strings')}, ` +
    'each formatted "<Category>: <requirement with a number in it>." Every entry needs a concrete, ' +
    'measurable target — a threshold, percentile, conformance level or time window — not an ' +
    'aspiration. Draw the categories from this list, covering as many as the product warrants and ' +
    `writing more than one entry for a category when it carries real weight:\n${NON_FUNCTIONAL_COVERAGE}\n\n` +
    'Do not restate a functional requirement as a non-functional one, or the reverse.\n\n' +
    `Rules:\n${QUALITY_RULES}\n\n` +
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
