import { useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { Badge, Button, Card, TextField } from '../ui';

// Idea input form (T023). Client-side validation mirrors the backend bounds (FR-005/FR-006);
// the form is disabled while a submission is in flight so the idea cannot be edited or
// resubmitted mid-generation (FR-007).

export const IDEA_MIN_LENGTH = 20;
export const IDEA_MAX_LENGTH = 2000;

const PLACEHOLDER =
  'E.g., I want to build a mobile app for dog walkers. It needs a booking system, real-time ' +
  'GPS tracking during walks, and a payment gateway. The app should have separate interfaces ' +
  'for dog owners and walkers...';

export interface IdeaFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

export function IdeaForm({ value, onChange, onSubmit, isSubmitting, submitError }: IdeaFormProps) {
  const [clientError, setClientError] = useState<string | null>(null);
  const trimmedLength = value.trim().length;
  const overLimit = value.length > IDEA_MAX_LENGTH;

  function handleGenerate() {
    if (trimmedLength < IDEA_MIN_LENGTH) {
      setClientError(
        `Tell us a bit more about your idea (at least ${IDEA_MIN_LENGTH} characters).`,
      );
      return;
    }
    if (overLimit) {
      setClientError(`Please shorten your description to ${IDEA_MAX_LENGTH} characters or fewer.`);
      return;
    }
    setClientError(null);
    onSubmit();
  }

  function handleClear() {
    onChange('');
    setClientError(null);
  }

  const error = clientError ?? submitError ?? null;

  return (
    <Card className="flex flex-col p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">Project Description</h2>
        <Badge variant="brand">AI Powered</Badge>
      </div>

      <div className="px-6 pt-4">
        <TextField
          id="idea"
          label="Describe your software idea"
          labelHidden
          appearance="plain"
          multiline
          rows={12}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={PLACEHOLDER}
          disabled={isSubmitting}
          invalid={error ? true : undefined}
          describedBy={error ? 'idea-error' : undefined}
        />
        <div className="flex items-center justify-end pb-1">
          <span
            className={overLimit ? 'text-xs font-medium text-red-600' : 'text-xs text-slate-400'}
          >
            {value.length} / {IDEA_MAX_LENGTH}
          </span>
        </div>
      </div>

      {error && (
        <p id="idea-error" role="alert" className="px-6 pb-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
        <button
          type="button"
          aria-label="Voice input (coming soon)"
          title="Voice input (coming soon)"
          disabled
          className="rounded-full p-2 text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60"
        >
          <Mic className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleClear}
            disabled={isSubmitting || value.length === 0}
          >
            Clear
          </Button>
          <Button variant="primary" onClick={handleGenerate} disabled={isSubmitting}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? 'Starting…' : 'Generate Specification'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
