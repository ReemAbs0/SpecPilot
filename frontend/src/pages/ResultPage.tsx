import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSpecification } from '../state/SpecificationContext';
import { ResultHeader } from '../components/result/ResultHeader';
import { SpecificationSections } from '../components/result/SpecificationSections';
import { ActionsPanel } from '../components/result/ActionsPanel';

// Generated Specification page (T028). Renders the eight structured sections of the result
// (via the shared SpecificationSections component) alongside the Actions sidebar (download /
// copy / generate again — User Story 3).

function formatTimestamp(): string {
  const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `Today at ${time}`;
}

export default function ResultPage() {
  const { state } = useSpecification();
  const timestamp = useMemo(() => formatTimestamp(), []);

  if (state.status !== 'success' || !state.specification) {
    // A regeneration started from this page (or its failure) belongs on the progress screen,
    // not the empty generator — this also avoids a redirect race when "Generate Again" flips
    // the status to 'generating' while this page is still mounted.
    const inProgress =
      state.status === 'submitting' || state.status === 'generating' || state.status === 'error';
    return <Navigate to={inProgress ? '/generate/progress' : '/generate'} replace />;
  }

  const spec = state.specification;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <ResultHeader title={spec.title} timestamp={timestamp} />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <SpecificationSections specification={spec} />

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <ActionsPanel specification={spec} />
          </div>
        </aside>
      </div>
    </div>
  );
}
