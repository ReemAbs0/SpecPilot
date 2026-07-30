import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Copy, Check, RefreshCw } from 'lucide-react';
import { Button, Card } from '../ui';
import { useSpecification } from '../../state/SpecificationContext';
import { startGeneration } from '../../services/specificationApi';
import type { Specification } from '../../types/specification.types';
import { specificationToMarkdown, markdownFilename } from '../../services/specificationMarkdown';

// Result-page actions sidebar (T035–T038). Download and Copy are entirely client-side (no
// network — research.md #6, FR-020/FR-021). "Generate Again" re-runs generation for the SAME
// idea (FR-015/FR-016): it starts a fresh session and routes to the Generating screen, which
// runs the pipeline again and lands on a new result. "Share Specification" from the design is
// intentionally omitted (resolved design/spec conflict — no persistence/sharing this version).

export function ActionsPanel({ specification }: { specification: Specification }) {
  const { state, dispatch } = useSpecification();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => clearTimeout(copyTimer.current ?? undefined), []);

  function handleDownload() {
    const blob = new Blob([specificationToMarkdown(specification)], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = markdownFilename(specification.title);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(specificationToMarkdown(specification));
      setCopied(true);
      clearTimeout(copyTimer.current ?? undefined);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked; fail quietly rather than crash the page.
      setCopied(false);
    }
  }

  async function handleGenerateAgain() {
    if (starting) return;
    setStarting(true);
    // Re-run generation with the SAME idea (preserved in state through the successful run).
    // Note: we do NOT dispatch SUBMIT here — that would flip status away from 'success' and
    // trip the ResultPage redirect before the request resolves. Once we have a session we move
    // straight to 'generating' and navigate to the progress screen.
    const result = await startGeneration(state.ideaText);
    if (result.ok) {
      dispatch({ type: 'GENERATION_STARTED', sessionId: result.sessionId });
    } else {
      dispatch({ type: 'FAILED', reason: 'upstream-error' });
    }
    navigate('/generate/progress');
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Actions</h2>

      <div className="mt-5 flex flex-col gap-3">
        <Button variant="primary" className="w-full" onClick={handleDownload}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download Markdown
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleCopy}>
          {copied ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </div>

      <hr className="my-6 border-slate-100 dark:border-slate-800" />

      <p className="text-sm text-slate-500 dark:text-slate-400">Need adjustments to the scope or tone?</p>
      <Button
        variant="secondary"
        className="mt-3 w-full"
        onClick={handleGenerateAgain}
        disabled={starting}
      >
        <RefreshCw className={`h-4 w-4 ${starting ? 'animate-spin' : ''}`} aria-hidden="true" />
        {starting ? 'Starting…' : 'Generate Again'}
      </Button>
    </Card>
  );
}
