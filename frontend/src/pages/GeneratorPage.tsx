import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpecification } from '../state/SpecificationContext';
import { startGeneration } from '../services/specificationApi';
import { IdeaForm } from '../components/generator/IdeaForm';
import { WritingTipsCard } from '../components/generator/WritingTipsCard';
import { ExamplePromptsCard } from '../components/generator/ExamplePromptsCard';

// Specification Generator page (T025). Collects the idea and starts generation, then routes
// to the progress screen. Idea text and status live in SpecificationContext.

export default function GeneratorPage() {
  const { state, dispatch } = useSpecification();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitting = state.status === 'submitting';

  async function handleSubmit() {
    setSubmitError(null);
    dispatch({ type: 'SUBMIT' });

    const result = await startGeneration(state.ideaText);
    if (result.ok) {
      dispatch({ type: 'GENERATION_STARTED', sessionId: result.sessionId });
      navigate('/generate/progress');
    } else {
      // Return to an editable state with the idea preserved, showing the server's message.
      dispatch({ type: 'CANCEL' });
      setSubmitError(result.error.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Generate Software Specification</h1>
      <p className="mt-2 max-w-2xl text-slate-500 dark:text-slate-400">
        Describe your idea, and our AI will instantly generate a comprehensive, structured software
        specification document.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IdeaForm
            value={state.ideaText}
            onChange={(value) => dispatch({ type: 'SET_IDEA', text: value })}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitError={submitError}
          />
        </div>
        <div className="flex flex-col gap-6">
          <WritingTipsCard />
          <ExamplePromptsCard
            onSelect={(prompt) => {
              setSubmitError(null);
              dispatch({ type: 'SET_IDEA', text: prompt });
            }}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
