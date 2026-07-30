import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Runtime UI theme selection (feature/material-theme). The app ships two design systems that
// render the SAME components/pages: 'classic' (the original Tailwind UI, default) and
// 'material' (Material UI). This context owns ONLY the selected mode + persistence; it does not
// touch any business logic. Presentational primitives read `useThemeMode()` and dispatch to a
// classic or material implementation, so switching is a pure UI concern.

export type ThemeMode = 'classic' | 'material';

const STORAGE_KEY = 'specpilot.theme';
const DEFAULT_MODE: ThemeMode = 'classic';

interface ThemeModeContextValue {
  /** The active UI design system. */
  mode: ThemeMode;
  /** Select a specific mode (persisted to localStorage). */
  setMode: (mode: ThemeMode) => void;
  /** Flip between classic and material. */
  toggle: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

/** Read the persisted mode, tolerating SSR/no-storage and unknown values. */
function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return DEFAULT_MODE;
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'material' || stored === 'classic' ? stored : DEFAULT_MODE;
  } catch {
    // localStorage can throw in private-mode/quota edge cases — fall back to the default.
    return DEFAULT_MODE;
  }
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);

  // Persist and expose the mode as a data attribute so CSS/tests can key off it.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore persistence failures — the in-memory mode still works for this session.
    }
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      setMode: setModeState,
      toggle: () => setModeState((current) => (current === 'classic' ? 'material' : 'classic')),
    }),
    [mode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

/** Access the active UI theme mode. Must be used within a ThemeModeProvider. */
export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return context;
}
