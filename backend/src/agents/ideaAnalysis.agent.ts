import { asText, asTextArray, requestJson } from './agentSupport';

// Stage 1 — "understanding the project idea" (T015). Produces the specification title,
// project summary, target users, and the distinct user roles the later stages build on.

export interface IdeaAnalysis {
  title: string;
  projectSummary: string;
  targetUsers: string;
  userRoles: string[];
}

const SYSTEM_PROMPT =
  'You are a senior software analyst. Read a product idea and extract its essence. ' +
  'Respond with ONLY a valid JSON object and no surrounding prose or code fences.';

export async function analyzeIdea(
  ideaText: string,
  opts: { signal?: AbortSignal },
): Promise<IdeaAnalysis> {
  const userPrompt =
    'Analyze the software idea below and return a JSON object with these keys:\n' +
    '- "title": a concise title for the specification (e.g. "E-Commerce Checkout Revamp Specification").\n' +
    '- "projectSummary": one paragraph summarizing the project and its goals.\n' +
    '- "targetUsers": a short phrase describing the primary target audience.\n' +
    '- "userRoles": an array of the distinct user roles (e.g. ["Admin", "Customer"]).\n\n' +
    `Idea:\n"""${ideaText}"""`;

  const data = await requestJson<Record<string, unknown>>(SYSTEM_PROMPT, userPrompt, opts);
  return {
    title: asText(data.title, 'title'),
    projectSummary: asText(data.projectSummary, 'projectSummary'),
    targetUsers: asText(data.targetUsers, 'targetUsers'),
    userRoles: asTextArray(data.userRoles, 'userRoles'),
  };
}
