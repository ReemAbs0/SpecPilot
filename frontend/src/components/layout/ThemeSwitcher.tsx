import { useThemeMode, type ThemeMode } from '../../state/ThemeContext';
import { cn } from '../ui';

// The Classic/Material design-system switch, rendered by DesignSystemDock in the bottom-left
// corner of the viewport.
//
// Deliberately NOT theme-aware. Every other piece of chrome re-renders itself in the active
// design system, but this control is the thing that *chooses* the design system: if it restyled
// itself on each switch, the one fixed reference point on screen would move underneath the user
// mid-decision. It therefore has a single neutral appearance — a plain segmented control in
// neither the Classic nor the Material idiom — and the only thing that changes on switching is
// which segment reads as selected.
//
// Neutral also means no brand accent on the active segment (that indigo is the app's own
// styling, not a neutral one) and an explicit `font-sans`, so the control cannot inherit
// typography from whichever theme surrounds it. It still tracks light/dark, which is a separate
// axis from the design system and only affects legibility against the page behind it.

const OPTIONS: Array<{ value: ThemeMode; label: string }> = [
  { value: 'classic', label: 'Classic' },
  { value: 'material', label: 'Material' },
];

export function ThemeSwitcher() {
  const { mode, setMode } = useThemeMode();

  return (
    <div
      role="group"
      aria-label="Design system"
      className="inline-flex items-center rounded-full border border-slate-300 bg-slate-100 p-0.5 font-sans text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
    >
      {OPTIONS.map((option) => {
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500',
              active
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
