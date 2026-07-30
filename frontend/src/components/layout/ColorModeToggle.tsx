import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { Moon, Sun } from 'lucide-react';
import { useThemeMode, type ColorMode } from '../../state/ThemeContext';
import { cn } from '../ui';

// Colour-mode switcher (feature/dark-mode). A two-option Light/Dark segmented control that sits
// alongside the Classic/Material theme switcher in the profile dropdown. Colour mode is an axis
// independent of the design system, and the selection is persisted to localStorage by
// ThemeModeProvider. Like ThemeSwitcher, the control is itself theme-aware so it looks native in
// whichever design system is active.

const OPTIONS: Array<{ value: ColorMode; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

export interface ColorModeToggleProps {
  // Tab order for the controls. Pass -1 to take them out of the tab order while a containing
  // dropdown is closed (the Classic profile menu stays mounted for its open/close animation).
  tabIndex?: number;
}

export function ColorModeToggle({ tabIndex = 0 }: ColorModeToggleProps = {}) {
  const { mode, colorMode, setColorMode } = useThemeMode();

  if (mode === 'material') {
    return (
      <ToggleButtonGroup
        size="small"
        exclusive
        value={colorMode}
        onChange={(_event, next: ColorMode | null) => {
          // MUI passes null when the active button is re-clicked — ignore it so a mode is always
          // selected.
          if (next) {
            setColorMode(next);
          }
        }}
        aria-label="Colour mode"
        sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, py: 0.25, gap: 0.75 } }}
      >
        {OPTIONS.map(({ value, label, Icon }) => (
          <ToggleButton key={value} value={value}>
            <Icon size={15} aria-hidden="true" />
            {label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  return (
    <div
      role="group"
      aria-label="Colour mode"
      className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = colorMode === value;
        return (
          <button
            key={value}
            type="button"
            tabIndex={tabIndex}
            onClick={() => setColorMode(value)}
            aria-pressed={active}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              active
                ? 'bg-brand-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
            )}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
