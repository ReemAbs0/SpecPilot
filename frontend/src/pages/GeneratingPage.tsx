import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useSpecification } from '../state/SpecificationContext';
import { openStream, startGeneration } from '../services/specificationApi';
import { Button } from '../components/ui';
import { ProgressCard } from '../components/generating/ProgressCard';

// Generation progress screen (T027). Opens the SSE stream for the active session, reflects
// stage progress, and handles success (→ result), failure/timeout (retry), and user
// cancellation (FR-011/FR-011a/FR-011b).

export default function GeneratingPage() {
  const { state, dispatch } = useSpecification();
  const navigate = useNavigate();
  const closeRef = useRef<(() => void) | null>(null);

  // Open the progress stream while a generation is running. Stage events keep status
  // 'generating', so this effect stays stable until a terminal transition.
  useEffect(() => {
    if (state.status !== 'generating' || !state.sessionId) {
      return;
    }
    const close = openStream(state.sessionId, {
      onStageStarted: (stage) => dispatch({ type: 'STAGE_STARTED', stage }),
      onStageCompleted: (stage) => dispatch({ type: 'STAGE_COMPLETED', stage }),
      onSucceeded: (specification) => dispatch({ type: 'SUCCEEDED', specification }),
      onFailed: (reason) => dispatch({ type: 'FAILED', reason }),
    });
    closeRef.current = close;
    return () => {
      close();
      closeRef.current = null;
    };
  }, [state.status, state.sessionId, dispatch]);

  // Redirect out of the progress screen for terminal/empty states.
  if (state.status === 'idle') {
    return <Navigate to="/generate" replace />;
  }
  if (state.status === 'success') {
    return <Navigate to="/result" replace />;
  }

  async function handleRetry() {
    dispatch({ type: 'SUBMIT' });
    const result = await startGeneration(state.ideaText);
    if (result.ok) {
      dispatch({ type: 'GENERATION_STARTED', sessionId: result.sessionId });
    } else {
      dispatch({ type: 'FAILED', reason: 'upstream-error' });
    }
  }

  function handleCancel() {
    // Closing the stream before a terminal event cancels the session on the backend (FR-011b).
    closeRef.current?.();
    dispatch({ type: 'CANCEL' });
    navigate('/generate');
  }

  function handleBackToEditor() {
    dispatch({ type: 'CANCEL' });
    navigate('/generate');
  }

  if (state.status === 'error') {
    const message =
      state.error === 'timeout'
        ? 'Generation took too long and timed out. Please try again.'
        : 'Something went wrong while generating your specification. Please try again.';
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-500" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Generation failed</h1>
        <p className="mt-2 text-slate-500" role="alert">
          {message}
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" onClick={handleRetry}>
            Try Again
          </Button>
          <Button variant="secondary" onClick={handleBackToEditor}>
            Back to editor
          </Button>
        </div>
      </div>
    );
  }

  // 'submitting' or 'generating' → show live progress.
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <ProgressCard activeStage={state.activeStage} completedStages={state.completedStages} />
      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md text-sm font-medium text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Cancel Generation
        </button>
      </div>
    </div>
  );
}
