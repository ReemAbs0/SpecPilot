import { useEffect, useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { Badge, Button, Card, TextField } from '../ui';
import { appendTranscript, useSpeechRecognition } from '../../hooks/useSpeechRecognition';

// Idea input form (T023). Client-side validation mirrors the backend bounds (FR-005/FR-006);
// the form is disabled while a submission is in flight so the idea cannot be edited or
// resubmitted mid-generation (FR-007).
//
// The microphone dictates into the same textarea via useSpeechRecognition: the hook owns the
// Web Speech engine, this component only renders its state (idle / listening / error) and
// appends each finalized phrase to the idea. Typing keeps working throughout — only completed
// phrases are appended, so nothing rewrites text while the user is editing it.

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

  const {
    supported: voiceSupported,
    listening,
    interimTranscript,
    error: voiceError,
    stop: stopListening,
    toggle: toggleListening,
  } = useSpeechRecognition({
    onTranscript: (phrase) => onChange(appendTranscript(value, phrase)),
  });

  // Generation takes the form out of the user's hands (FR-007), so the microphone goes with it.
  useEffect(() => {
    if (isSubmitting && listening) {
      stopListening();
    }
  }, [isSubmitting, listening, stopListening]);

  const voiceLabel = !voiceSupported
    ? 'Voice input isn’t supported in this browser'
    : listening
      ? 'Stop voice input'
      : 'Start voice input';

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
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Project Description</h2>
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
            className={
              overLimit
                ? 'text-xs font-medium text-red-600 dark:text-red-400'
                : 'text-xs text-slate-400 dark:text-slate-500'
            }
          >
            {value.length} / {IDEA_MAX_LENGTH}
          </span>
        </div>
      </div>

      {error && (
        <p id="idea-error" role="alert" className="px-6 pb-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            aria-label={voiceLabel}
            aria-pressed={voiceSupported ? listening : undefined}
            title={voiceLabel}
            disabled={isSubmitting || !voiceSupported}
            className={
              listening
                ? 'rounded-full bg-red-50 dark:bg-red-500/15 p-2 text-red-600 dark:text-red-400 ring-2 ring-red-500/50 animate-pulse transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60'
                : 'rounded-full p-2 text-slate-400 dark:text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-slate-400'
            }
          >
            <Mic className="h-5 w-5" aria-hidden="true" />
          </button>

          {voiceError ? (
            <p role="alert" className="min-w-0 truncate text-xs text-red-600 dark:text-red-400">
              {voiceError}
            </p>
          ) : (
            listening && (
              <p
                aria-live="polite"
                className="flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500"
                />
                <span className="truncate">{interimTranscript || 'Listening…'}</span>
              </p>
            )
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
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
