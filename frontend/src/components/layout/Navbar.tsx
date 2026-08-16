import { useThemeMode } from '../../state/ThemeContext';
import { ClassicNavbar } from './Navbar.classic';
import { MaterialNavbar } from './Navbar.material';

// Theme-aware top navigation (feature/material-theme). Same public API as the original Navbar (a
// zero-prop component rendered by AppLayout), dispatching to the Classic (Tailwind header) or
// Material (MUI AppBar) navbar.

export function Navbar() {
  const { mode } = useThemeMode();
  return mode === 'material' ? <MaterialNavbar /> : <ClassicNavbar />;
}
