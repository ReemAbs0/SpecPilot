import type {
  GenerationFailureReason,
  GenerationStage,
  Specification,
} from '../types/specification.types';

// Pure state logic for the generation flow (research.md #5), kept free of React so it can be
// reasoned about and unit-tested on its own (constitution Principle III: separate business/
// state rules from UI plumbing). The React wiring lives in SpecificationContext.tsx.

/** The status states of the generation flow (research.md #5). */
export type SpecStatus = 'idle' | 'submitting' | 'generating' | 'success' | 'error';

export interface SpecState {
  status: SpecStatus;
  /** The current idea text. Preserved across retry so the user never re-types it (FR-011). */
  ideaText: string;
  /** Correlates the active session to its SSE stream; null until generation starts. */
  sessionId: string | null;
  /** The stage currently running (FR-010); null when not generating. */
  activeStage: GenerationStage | null;
  /** Stages completed so far, in order (FR-010). */
  completedStages: GenerationStage[];
  /** The generated specification; set on success. */
  specification: Specification | null;
  /** Why generation failed; set on error (FR-011/FR-011a). */
  error: GenerationFailureReason | null;
}

export const initialSpecState: SpecState = {
  status: 'idle',
  ideaText: '',
  sessionId: null,
  activeStage: null,
  completedStages: [],
  specification: null,
  error: null,
};

/** Actions that drive the generation flow. */
export type SpecAction =
  | { type: 'SET_IDEA'; text: string }
  | { type: 'SUBMIT' }
  | { type: 'GENERATION_STARTED'; sessionId: string }
  | { type: 'STAGE_STARTED'; stage: GenerationStage }
  | { type: 'STAGE_COMPLETED'; stage: GenerationStage }
  | { type: 'SUCCEEDED'; specification: Specification }
  | { type: 'FAILED'; reason: GenerationFailureReason }
  // Cancel an in-progress generation (FR-011b): return to idle but keep the idea text.
  | { type: 'CANCEL' };

export function specReducer(state: SpecState, action: SpecAction): SpecState {
  switch (action.type) {
    case 'SET_IDEA':
      return { ...state, ideaText: action.text };
    case 'SUBMIT':
      return { ...state, status: 'submitting', error: null, specification: null };
    case 'GENERATION_STARTED':
      return {
        ...state,
        status: 'generating',
        sessionId: action.sessionId,
        activeStage: null,
        completedStages: [],
        error: null,
      };
    case 'STAGE_STARTED':
      return { ...state, activeStage: action.stage };
    case 'STAGE_COMPLETED':
      return {
        ...state,
        completedStages: state.completedStages.includes(action.stage)
          ? state.completedStages
          : [...state.completedStages, action.stage],
      };
    case 'SUCCEEDED':
      return {
        ...state,
        status: 'success',
        specification: action.specification,
        activeStage: null,
      };
    case 'FAILED':
      return { ...state, status: 'error', error: action.reason, activeStage: null };
    case 'CANCEL':
      // Keep ideaText so the user can resubmit without re-typing (FR-011b).
      return { ...initialSpecState, ideaText: state.ideaText };
    default:
      return state;
  }
}
