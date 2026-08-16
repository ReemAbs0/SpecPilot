import { ThemeSwitcher } from './ThemeSwitcher';

// Floating dock for the Classic/Material design-system switch. It used to live inside the
// profile dropdown, which made it reachable only when signed in and only after two clicks;
// choosing a design system is an app-wide display preference, so it now sits fixed in the
// bottom-left corner of the viewport — always on screen, always available, signed in or not.
//
// Like the switch it carries, the dock is intentionally not theme-aware: it is the frame around
// the control that chooses the design system, so re-skinning it per theme would undermine the
// stable reference point the switch is meant to be. One neutral surface in all four theme
// combinations.

export function DesignSystemDock() {
  return (
    <div className="fixed bottom-4 left-4 z-40 rounded-full shadow-lg shadow-slate-900/10 dark:shadow-black/40">
      <ThemeSwitcher />
    </div>
  );
}
