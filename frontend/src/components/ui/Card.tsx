import { type HTMLAttributes } from 'react';
import { useThemeMode } from '../../state/ThemeContext';
import { ClassicCard } from './Card.classic';
import { MaterialCard } from './Card.material';

// Theme-aware card primitive (feature/material-theme). Same public API as the original Card
// (a styled div wrapper), dispatching to the Classic (Tailwind) or Material (MUI Paper) surface.

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  const { mode } = useThemeMode();
  return mode === 'material' ? <MaterialCard {...props} /> : <ClassicCard {...props} />;
}
