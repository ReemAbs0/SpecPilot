import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdeaForm } from '../src/components/generator/IdeaForm';
import { appendTranscript } from '../src/hooks/useSpeechRecognition';

// Voice input on the generator: the existing microphone button drives the Web Speech API
// through useSpeechRecognition. The engine is faked on `window`, so these tests cover the wiring
// (start/stop, transcript insertion, live feedback, errors, unsupported browsers) without a real
// microphone or network.

interface ResultEntry {
  transcript: string;
  isFinal: boolean;
}

class FakeRecognition {
  static instances: FakeRecognition[] = [];
  lang = '';
  continuous = false;
  interimResults = false;
  starts = 0;
  stops = 0;
  aborts = 0;
  onresult: ((event: { resultIndex: number; results: unknown }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    FakeRecognition.instances.push(this);
  }

  start() {
    this.starts += 1;
  }

  stop() {
    this.stops += 1;
    this.onend?.();
  }

  abort() {
    this.aborts += 1;
  }

  /** Delivers recognition results the way the browser does (array-like, indexed from 0). */
  emitResults(entries: ResultEntry[]) {
    const results = entries.map((entry) => ({ isFinal: entry.isFinal, 0: { transcript: entry.transcript } }));
    act(() => this.onresult?.({ resultIndex: 0, results }));
  }

  emitError(code: string) {
    act(() => this.onerror?.({ error: code }));
  }

  /** The engine ending a session on its own (e.g. Chrome after a silence). */
  emitEnd() {
    act(() => this.onend?.());
  }
}

function latest(): FakeRecognition {
  const instance = FakeRecognition.instances.at(-1);
  if (!instance) throw new Error('No SpeechRecognition was constructed');
  return instance;
}

/** IdeaForm is controlled; this holds the idea text the way GeneratorPage does. */
function Harness({ isSubmitting = false, initial = '' }: { isSubmitting?: boolean; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <IdeaForm
      value={value}
      onChange={setValue}
      onSubmit={() => {}}
      isSubmitting={isSubmitting}
    />
  );
}

const micButton = () => screen.getByRole('button', { name: /voice input/i });
const textarea = () => screen.getByLabelText(/describe your software idea/i);

beforeEach(() => {
  FakeRecognition.instances = [];
  vi.stubGlobal('webkitSpeechRecognition', FakeRecognition);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('voice input — dictation', () => {
  it('starts listening on click and shows a live recording indicator', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: /start voice input/i }));

    const recognition = latest();
    expect(recognition.starts).toBe(1);
    // Continuous, interim-capable session so pauses don't end dictation.
    expect(recognition.continuous).toBe(true);
    expect(recognition.interimResults).toBe(true);

    // The same button now offers to stop, and is marked pressed for assistive tech.
    expect(micButton()).toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByText('Listening…')).toBeInTheDocument();
  });

  it('inserts each finalized phrase into the idea textarea as it is recognised', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());

    latest().emitResults([{ transcript: 'A mobile app for dog walkers.', isFinal: true }]);
    expect(textarea()).toHaveValue('A mobile app for dog walkers.');

    latest().emitResults([{ transcript: 'It needs GPS tracking.', isFinal: true }]);
    expect(textarea()).toHaveValue('A mobile app for dog walkers. It needs GPS tracking.');
  });

  it('shows interim words as feedback without writing them into the textarea', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());

    latest().emitResults([{ transcript: 'a booking system', isFinal: false }]);

    expect(screen.getByText('a booking system')).toBeInTheDocument();
    expect(textarea()).toHaveValue('');
  });

  it('lets the user keep typing while voice input is active', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());

    await user.type(textarea(), 'Typed by hand.');
    expect(textarea()).toHaveValue('Typed by hand.');

    // A phrase recognised afterwards is appended to what was typed, not instead of it.
    latest().emitResults([{ transcript: 'Spoken after typing.', isFinal: true }]);
    expect(textarea()).toHaveValue('Typed by hand. Spoken after typing.');
    expect(micButton()).toHaveAttribute('aria-pressed', 'true');
  });

  it('stops listening when the microphone is clicked again', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());
    await user.click(micButton());

    expect(latest().stops).toBe(1);
    expect(screen.getByRole('button', { name: /start voice input/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByText('Listening…')).not.toBeInTheDocument();
  });

  it('resumes when the browser ends a session while the user is still dictating', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());

    latest().emitEnd();

    expect(latest().starts).toBe(2);
    expect(micButton()).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('voice input — failure handling', () => {
  it('explains a denied microphone permission and returns to idle', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());

    latest().emitError('not-allowed');

    expect(await screen.findByRole('alert')).toHaveTextContent(/microphone access is blocked/i);
    expect(screen.getByRole('button', { name: /start voice input/i })).toBeInTheDocument();
  });

  it('reports a recognition error without losing the dictated text', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());
    latest().emitResults([{ transcript: 'Keep this text.', isFinal: true }]);

    latest().emitError('network');

    expect(await screen.findByRole('alert')).toHaveTextContent(/internet connection/i);
    expect(textarea()).toHaveValue('Keep this text.');
  });

  it('keeps listening through a silent pause (no-speech)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(micButton());

    latest().emitError('no-speech');

    expect(await screen.findByRole('alert')).toHaveTextContent(/didn’t hear anything/i);
    expect(micButton()).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables the microphone in a browser without the Web Speech API', () => {
    vi.unstubAllGlobals();
    render(<Harness />);

    const button = screen.getByRole('button', { name: /isn’t supported in this browser/i });
    expect(button).toBeDisabled();
    expect(FakeRecognition.instances).toHaveLength(0);
  });

  it('disables the microphone while a generation is starting', () => {
    render(<Harness isSubmitting />);
    expect(screen.getByRole('button', { name: /start voice input/i })).toBeDisabled();
  });
});

describe('appendTranscript', () => {
  it('fills an empty field without a leading space', () => {
    expect(appendTranscript('', 'Hello there')).toBe('Hello there');
    expect(appendTranscript('   ', 'Hello there')).toBe('Hello there');
  });

  it('separates phrases with a single space and respects existing whitespace', () => {
    expect(appendTranscript('First phrase.', 'Second phrase.')).toBe('First phrase. Second phrase.');
    expect(appendTranscript('First phrase. ', 'Second phrase.')).toBe('First phrase. Second phrase.');
    expect(appendTranscript('First line.\n', 'Second line.')).toBe('First line.\nSecond line.');
  });

  it('ignores an empty phrase', () => {
    expect(appendTranscript('Unchanged.', '   ')).toBe('Unchanged.');
  });
});
