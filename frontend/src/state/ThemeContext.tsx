import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Runtime UI theme selection. The app exposes TWO INDEPENDENT theming axes, both owned here and
// both pure UI state (no business logic):
//   1. `mode` — the design system: 'classic' (original Tailwind UI, default) or 'material' (MUI).
//      Added in feature/material-theme. Presentational primitives read `useThemeMode()` and
//      dispatch to a classic or material implementation.
//   2. `colorMode` — the colour scheme: 'light' (default) or 'dark'. Added in feature/dark-mode.
//      Orthogonal to the design system, so all four combinations are valid (Classic Light,
//      Classic Dark, Material Light, Material Dark). Classic reads it via Tailwind's `.dark`
//      class on <html>; Material reads it by swapping to a dark MUI palette.
// Each axis persists under its own localStorage key so they can be changed independently.

export type ThemeMode = 'classic' | 'material';
export type ColorMode = 'light' | 'dark';

const STORAGE_KEY = 'specpilot.theme';
const COLOR_MODE_STORAGE_KEY = 'specpilot.colorMode';
const DEFAULT_MODE: ThemeMode = 'classic';
const DEFAULT_COLOR_MODE: ColorMode = 'light';

interface ThemeModeContextValue {
  /** The active UI design system. */
  mode: ThemeMode;
  /** Select a specific design system (persisted to localStorage). */
  setMode: (mode: ThemeMode) => void;
  /** Flip between classic and material. */
  toggle: () => void;
  /** The active colour scheme (independent of the design system). */
  colorMode: ColorMode;
  /** Select a specific colour scheme (persisted to localStorage). */
  setColorMode: (colorMode: ColorMode) => void;
  /** Flip between light and dark. */
  toggleColorMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

/** Read the persisted design system, tolerating SSR/no-storage and unknown values. */
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

/** Read the persisted colour scheme, tolerating SSR/no-storage and unknown values. */
function readStoredColorMode(): ColorMode {
  if (typeof window === 'undefined') {
    return DEFAULT_COLOR_MODE;
  }
  try {
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : DEFAULT_COLOR_MODE;
  } catch {
    return DEFAULT_COLOR_MODE;
  }
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredColorMode);

  // Persist and expose the design system as a data attribute so CSS/tests can key off it.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Ignore persistence failures — the in-memory mode still works for this session.
    }
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  // Persist the colour scheme and drive the global signals both design systems read:
  //   - the `.dark` class on <html> — Tailwind's `selector` dark variant keys off this (Classic),
  //   - `data-color-mode` — a stable hook for CSS/tests,
  //   - `color-scheme` — so native UI (scrollbars, form controls) matches the theme.
  useEffect(() => {
    try {
      window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
    } catch {
      // Ignore persistence failures — the in-memory colour mode still works for this session.
    }
    const root = document.documentElement;
    root.classList.toggle('dark', colorMode === 'dark');
    root.dataset.colorMode = colorMode;
    root.style.colorScheme = colorMode;
  }, [colorMode]);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      setMode: setModeState,
      toggle: () => setModeState((current) => (current === 'classic' ? 'material' : 'classic')),
      colorMode,
      setColorMode: setColorModeState,
      toggleColorMode: () =>
        setColorModeState((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [mode, colorMode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

// Used when a component that reads the theme is rendered outside a ThemeModeProvider (e.g. an
// isolated component test). Since Classic is the app's default theme, falling back to it keeps
// the shared primitives usable anywhere; the setters are no-ops because there is no provider
// state to update.
const FALLBACK: ThemeModeContextValue = {
  mode: DEFAULT_MODE,
  setMode: () => {},
  toggle: () => {},
  colorMode: DEFAULT_COLOR_MODE,
  setColorMode: () => {},
  toggleColorMode: () => {},
};

/** Access the active UI theme mode. Falls back to the default Classic mode outside a provider. */
export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext) ?? FALLBACK;
}
