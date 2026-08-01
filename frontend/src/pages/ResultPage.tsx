import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSpecification } from '../state/SpecificationContext';
import { useAuth } from '../state/AuthContext';
import { updateSpecificationTitle } from '../services/specificationStore';
import { ResultHeader } from '../components/result/ResultHeader';
import { SpecificationSections } from '../components/result/SpecificationSections';
import { ActionsPanel } from '../components/result/ActionsPanel';

// Generated Specification page (T028). Renders the eight structured sections of the result
// (via the shared SpecificationSections component) alongside the Actions sidebar (download /
// copy / generate again — User Story 3).
//
// The title can be renamed in place from the header. The rename updates the in-memory
// specification immediately, and — when this run was persisted to a signed-in user's account
// (state.savedId) — is written to Firestore first so the two never drift apart.

function formatTimestamp(): string {
  const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `Today at ${time}`;
}

export default function ResultPage() {
  const { state, dispatch } = useSpecification();
  const { user } = useAuth();
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
  const savedId = state.savedId;

  /**
   * Renames the specification. Persists first when there is a stored record, and only then
   * updates local state — so a failed write surfaces as an error in the header instead of
   * leaving the screen showing a title the account doesn't have. Throwing signals that failure.
   */
  async function handleSaveTitle(nextTitle: string) {
    if (user && savedId) {
      const token = await user.getIdToken();
      const result = await updateSpecificationTitle(token, savedId, nextTitle);
      if (!result.ok) {
        throw new Error(result.error ?? 'rename_failed');
      }
    }
    dispatch({ type: 'TITLE_UPDATED', title: nextTitle });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <ResultHeader title={spec.title} timestamp={timestamp} onSaveTitle={handleSaveTitle} />

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
