import { useCallback, useEffect, useRef, useState } from 'react';

// Voice input via the browser's native Web Speech API (feature: voice dictation on the
// generator). All recognition logic — feature detection, session lifecycle, transcript
// assembly, and error translation — lives here so components only deal with a small state
// machine: `supported`, `listening`, `interimTranscript`, `error`, and start/stop
// (constitution Principle III: UI code holds no engine logic).
//
// The API is unprefixed in most browsers and `webkit`-prefixed in Chrome/Safari; neither is in
// TypeScript's DOM lib, so the minimal shapes this hook actually uses are typed below rather
// than pulling in a dependency. Nothing is read off `window` until the hook runs, so this stays
// safe in SSR/jsdom environments where the constructor is simply absent.

/** The subset of a SpeechRecognitionResult we read. */
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechResultEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResultLike };
}

interface SpeechErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Returns the browser's SpeechRecognition constructor, or null when unsupported. */
function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const candidate = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

/** Turns a Web Speech error code into something worth showing a user. */
function messageForError(code: string): string | null {
  switch (code) {
    case 'aborted':
      // We aborted the session ourselves (stop/unmount) — not a failure.
      return null;
    case 'no-speech':
      return 'We didn’t hear anything. Try speaking a little closer to the microphone.';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it in your browser settings to use voice input.';
    case 'audio-capture':
      return 'No microphone was found. Connect one and try again.';
    case 'network':
      return 'Voice input needs an internet connection. Please try again.';
    default:
      return 'Voice input stopped unexpectedly. Please try again.';
  }
}

export interface UseSpeechRecognitionOptions {
  /**
   * Receives each finalized phrase as it is recognised. Only final results are reported, so the
   * caller never has to reconcile text that is still changing with what the user is typing.
   */
  onTranscript: (transcript: string) => void;
  /** BCP-47 language tag; defaults to the browser's language. */
  lang?: string;
}

export interface SpeechRecognitionControls {
  /** False when the browser has no Web Speech API — callers should disable the affected UI. */
  supported: boolean;
  listening: boolean;
  /** Words recognised but not yet finalized, for live feedback while speaking. */
  interimTranscript: string;
  /** User-facing failure message; null when there is nothing to report. */
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

export function useSpeechRecognition({
  onTranscript,
  lang,
}: UseSpeechRecognitionOptions): SpeechRecognitionControls {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // The user's intent, read inside engine callbacks: a browser may end a session on its own
  // (Chrome stops after a stretch of silence), and we resume only while the user still wants to
  // dictate. Kept in a ref so the callbacks never close over a stale render.
  const wantsListeningRef = useRef(false);
  // Latest callback, so a fresh phrase is always appended to the current idea text.
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const stop = useCallback(() => {
    wantsListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || wantsListeningRef.current) {
      return;
    }

    const recognition = new Ctor();
    recognition.lang = lang ?? navigator.language ?? 'en-US';
    // Keep the session open across pauses, and surface words as they are heard.
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          const finalized = text.trim();
          if (finalized !== '') {
            onTranscriptRef.current(finalized);
          }
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event) => {
      const message = messageForError(event.error);
      if (message) {
        setError(message);
      }
      // Anything other than "we heard nothing yet" ends the session for good; a transient
      // no-speech is left alone so a thinking pause doesn't cancel the user's dictation.
      if (event.error !== 'no-speech') {
        wantsListeningRef.current = false;
        setListening(false);
        setInterimTranscript('');
      }
    };

    recognition.onend = () => {
      setInterimTranscript('');
      if (!wantsListeningRef.current) {
        setListening(false);
        return;
      }
      // The engine ended the session but the user has not stopped — resume. If the browser
      // refuses, fall back to the idle state rather than looping.
      try {
        recognition.start();
      } catch {
        wantsListeningRef.current = false;
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    wantsListeningRef.current = true;
    setError(null);
    setInterimTranscript('');
    try {
      recognition.start();
      setListening(true);
    } catch {
      // start() throws if a session is somehow already running or the engine is unavailable.
      wantsListeningRef.current = false;
      setListening(false);
      setError('Voice input could not be started. Please try again.');
    }
  }, [lang]);

  const toggle = useCallback(() => {
    if (wantsListeningRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  // Never leave a live microphone behind when the form unmounts.
  useEffect(() => {
    return () => {
      wantsListeningRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
      }
    };
  }, []);

  return { supported, listening, interimTranscript, error, start, stop, toggle };
}

/**
 * Appends a recognised phrase to existing text: keeps one space between sentences, avoids a
 * leading space in an empty field, and leaves whatever the user typed untouched. Pure, so the
 * spacing rules can be tested without the speech engine.
 */
export function appendTranscript(current: string, phrase: string): string {
  const addition = phrase.trim();
  if (addition === '') {
    return current;
  }
  if (current.trim() === '') {
    return addition;
  }
  // Respect a trailing space/newline the user already typed.
  return /\s$/.test(current) ? `${current}${addition}` : `${current} ${addition}`;
}
