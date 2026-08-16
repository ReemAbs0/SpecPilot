import IconButton from '@mui/material/IconButton';
import { Moon, Sun } from 'lucide-react';
import { useThemeMode } from '../../state/ThemeContext';

// Light/Dark switch for the far right of the navbar. Previously a two-option segmented control
// buried in the profile dropdown; it is now a single icon button on the bar itself, available
// signed in or out.
//
// The icon shows the mode you would switch TO, which is the convention users expect from a
// one-click toggle: a moon while Light is active, a sun while Dark is active. The accessible
// name states the action rather than the state, so it never reads ambiguously in a screen
// reader. Colour-mode state and persistence are unchanged — this calls ThemeContext's existing
// `toggleColorMode`.

export function ColorModeToggle() {
  const { mode, colorMode, toggleColorMode } = useThemeMode();
  const isDark = colorMode === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const Icon = isDark ? Sun : Moon;

  if (mode === 'material') {
    return (
      // `color="inherit"` keeps the button legible on both AppBar treatments: white on the
      // indigo light bar, standard text colour on the dark bar.
      <IconButton onClick={toggleColorMode} aria-label={label} title={label} color="inherit">
        <Icon size={20} aria-hidden="true" />
      </IconButton>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleColorMode}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
