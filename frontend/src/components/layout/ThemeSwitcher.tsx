import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useThemeMode, type ThemeMode } from '../../state/ThemeContext';
import { cn } from '../ui';

// Visible runtime theme switcher (feature/material-theme). A two-option segmented control shown
// in the navbar that flips between the Classic (Tailwind) and Material (MUI) design systems. The
// selection is persisted to localStorage by ThemeModeProvider, so it survives refreshes. The
// control is itself theme-aware so it looks native in whichever theme is active.

const OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'classic', label: 'Classic' },
  { value: 'material', label: 'Material' },
];

export interface ThemeSwitcherProps {
  // Tab order for the controls. Pass -1 to take them out of the tab order while a containing
  // dropdown is closed (the Classic profile menu stays mounted for its open/close animation).
  tabIndex?: number;
}

export function ThemeSwitcher({ tabIndex = 0 }: ThemeSwitcherProps = {}) {
  const { mode, setMode } = useThemeMode();

  if (mode === 'material') {
    return (
      <ToggleButtonGroup
        size="small"
        exclusive
        value={mode}
        onChange={(_event, next: ThemeMode | null) => {
          // MUI passes null when the active button is re-clicked — ignore it so a theme is always
          // selected.
          if (next) {
            setMode(next);
          }
        }}
        aria-label="Theme"
        sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5, py: 0.25 } }}
      >
        {OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 text-xs font-medium"
    >
      {OPTIONS.map((option) => {
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            tabIndex={tabIndex}
            onClick={() => setMode(option.value)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              active ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
