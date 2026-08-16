import { useThemeMode } from '../../state/ThemeContext';
import { ClassicSpinner } from './Spinner.classic';
import { MaterialSpinner } from './Spinner.material';

// Theme-aware loading indicator (feature/material-theme). Same public API as the original
// Spinner, dispatching to the Classic (lucide) or Material (MUI CircularProgress) implementation.

export interface SpinnerProps {
  label?: string;
  className?: string;
}

export function Spinner(props: SpinnerProps) {
  const { mode } = useThemeMode();
  return mode === 'material' ? <MaterialSpinner {...props} /> : <ClassicSpinner {...props} />;
}
