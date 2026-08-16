import { type HTMLAttributes } from 'react';
import { useThemeMode } from '../../state/ThemeContext';
import { ClassicBadge } from './Badge.classic';
import { MaterialBadge } from './Badge.material';

// Theme-aware badge primitive (feature/material-theme). Same public API as the original Badge,
// dispatching to the Classic (Tailwind span) or Material (MUI Chip) implementation.

export type BadgeVariant = 'brand' | 'success' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge(props: BadgeProps) {
  const { mode } = useThemeMode();
  if (mode === 'material') {
    const { variant, className, children } = props;
    return (
      <MaterialBadge variant={variant} className={className}>
        {children}
      </MaterialBadge>
    );
  }
  return <ClassicBadge {...props} />;
}
