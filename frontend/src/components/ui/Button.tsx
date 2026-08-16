import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { useThemeMode } from '../../state/ThemeContext';
import { ClassicButton } from './Button.classic';
import { MaterialButton } from './Button.material';

// Theme-aware button primitive (feature/material-theme). Public API is unchanged from the
// original single-theme Button, so every caller keeps working untouched; this dispatcher just
// picks the Classic (Tailwind) or Material (MUI) implementation from the active theme mode.

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { mode } = useThemeMode();
  return mode === 'material' ? (
    <MaterialButton ref={ref} {...props} />
  ) : (
    <ClassicButton ref={ref} {...props} />
  );
});
