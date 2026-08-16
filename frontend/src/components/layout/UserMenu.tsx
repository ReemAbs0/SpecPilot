import { useThemeMode } from '../../state/ThemeContext';
import { ClassicUserMenu } from './UserMenu.classic';
import { MaterialUserMenu } from './UserMenu.material';

// Theme-aware profile menu (feature/material-theme). Same public API (a zero-prop component that
// reads the signed-in user from auth), dispatching to the Classic dropdown or the Material menu.

export function UserMenu() {
  const { mode } = useThemeMode();
  return mode === 'material' ? <MaterialUserMenu /> : <ClassicUserMenu />;
}
