// Shared domain types for SpecPilot (see specs/001-specpilot/data-model.md).
// These are in-memory/transient shapes only — there is no persistence (FR-017).
// This file is mirrored in frontend/src/types/specification.types.ts (kept in sync
// manually per constitution Principle II — no shared package for a two-project MVP).

/** The free-text description of a software idea submitted by the user. */
export interface ProjectIdea {
  /** The idea description. Validated length 20–2,000 chars (FR-005/FR-006, research.md #4). */
  text: string;
}

/** The five fixed generation stages (FR-009). */
export type GenerationStage =
  | 'understanding-idea'
  | 'generating-requirements'
  | 'creating-user-stories'
  | 'preparing-milestones'
  | 'formatting-document';

/**
 * The stages in their fixed display/run order (FR-009). The order is not customized per
 * idea; both the backend orchestrator and the frontend progress UI iterate this tuple.
 */
export const GENERATION_STAGES: readonly GenerationStage[] = [
  'understanding-idea',
  'generating-requirements',
  'creating-user-stories',
  'preparing-milestones',
  'formatting-document',
] as const;

/** Overall status of a generation session. */
export type GenerationStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

/**
 * Why a session failed. Only meaningful when status === 'failed'.
 * - 'timeout': generation exceeded the max wait time (FR-011a).
 * - 'upstream-error': a generic AI-call/stage failure (FR-011).
 */
export type GenerationFailureReason = 'upstream-error' | 'timeout';

/** Tracks one in-progress (or just-finished) attempt to turn an idea into a specification. */
export interface GenerationSession {
  /** Per-request id used only to correlate the SSE stream to its POST request. */
  id: string;
  /** The input being processed. */
  idea: ProjectIdea;
  /** Overall session status. 'cancelled' (FR-011b) is distinct from 'failed'. */
  status: GenerationStatus;
  /** The stage currently running; null once the session is terminal. */
  activeStage: GenerationStage | null;
  /** Stages finished so far, in order — drives the done/active/pending UI (FR-010). */
  completedStages: GenerationStage[];
  /** Set only when status === 'failed'; otherwise null. */
  failureReason: GenerationFailureReason | null;
}

/** A single generated user story (FR-013 section 6). */
export interface UserStory {
  /** Short title. */
  title: string;
  /** "As a <role>, I want <goal>, so that <benefit>" style text. */
  narrative: string;
  /** References one of Specification.userRoles for consistency. */
  role: string;
}

/** A single development milestone (FR-013 section 7). */
export interface Milestone {
  /** Milestone name. */
  name: string;
  /** What is delivered at this milestone. */
  description: string;
  /** Sequence position — milestones are always rendered in this order. */
  order: number;
}

/**
 * The structured output document for one idea (FR-013). All eight fields are required on a
 * successful generation (FR-013/FR-014); a stage that cannot fill its section(s) is treated
 * as a failure, not a partially-empty success.
 */
export interface Specification {
  projectSummary: string;
  targetUsers: string;
  userRoles: string[];
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  userStories: UserStory[];
  milestones: Milestone[];
  technicalConsiderations: string[];
}
