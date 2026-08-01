import { asLabelArray, asText, requestJson } from './agentSupport';
import { JSON_ONLY, QUALITY_RULES, assessComplexity, range, scopeBrief } from './promptSupport';

// Stage 1 — "understanding the project idea" (T015). Produces the specification title,
// project summary, target users, and the distinct user roles the later stages build on.

export interface IdeaAnalysis {
  title: string;
  projectSummary: string;
  targetUsers: string;
  userRoles: string[];
}

const SYSTEM_PROMPT =
  'You are a senior software analyst with 15 years of experience writing specifications that ' +
  'engineering teams build from. You read a product idea, infer the unstated but necessary ' +
  'scope around it, and describe the system precisely. ' +
  JSON_ONLY;

export async function analyzeIdea(
  ideaText: string,
  opts: { signal?: AbortSignal },
): Promise<IdeaAnalysis> {
  const profile = assessComplexity(ideaText);

  const userPrompt =
    'Analyse the software idea below and open its specification.\n\n' +
    `${scopeBrief(profile)}\n\n` +
    'Return a JSON object with exactly these keys:\n\n' +
    '- "title": the specification title, naming the product and its domain ' +
    '(e.g. "Field Service Scheduling Platform — Software Specification"). No marketing language.\n\n' +
    `- "projectSummary": ${profile.summary}, as ONE string with paragraphs separated by a blank ` +
    'line (\\n\\n). Cover, in order: (1) the problem and the operating context it occurs in — who ' +
    'is affected today and what the current workaround costs them; (2) what the system does — its ' +
    'primary capabilities, the core domain entities it manages, and how the main workflow runs ' +
    'end to end; (3) the value it delivers, plus what is explicitly OUT of scope for the first ' +
    'release. Write it as the opening section of a real specification, not as a product pitch.\n\n' +
    '- "targetUsers": two or three sentences naming the concrete audience segments, their context ' +
    'of use (device, environment, frequency), and their relevant constraints or expertise level.\n\n' +
    `- "userRoles": an array of ${range(profile.userRoles, 'distinct roles')}, as plain strings of ` +
    'one to three words each — bare labels like "Dispatcher" or "Clinic Admin", with NO ' +
    'descriptions, colons or explanations attached (they are rendered as short tags). A role ' +
    "belongs here only if it has permissions or workflows the other roles do not. Use the domain's own job " +
    'titles rather than generic labels where the idea implies them. Include an administrative or ' +
    'operator role when the system plainly needs someone to configure it, moderate content, or ' +
    'resolve failures — but do not invent roles the product has no use for.\n\n' +
    `Rules:\n${QUALITY_RULES}\n\n` +
    `Idea:\n"""${ideaText}"""`;

  const data = await requestJson<Record<string, unknown>>(SYSTEM_PROMPT, userPrompt, opts);
  return {
    title: asText(data.title, 'title'),
    projectSummary: asText(data.projectSummary, 'projectSummary'),
    targetUsers: asText(data.targetUsers, 'targetUsers'),
    userRoles: asLabelArray(data.userRoles, 'userRoles'),
  };
}
