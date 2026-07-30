import { type HTMLAttributes } from 'react';
import Paper from '@mui/material/Paper';
import { cn } from './cn';

// Material (MUI) card surface. Renders a clearly elevated, borderless MUI <Paper> (a rounded
// Material surface with a real drop shadow) rather than the flat, bordered Classic card — so the
// Material theme is immediately distinguishable. Default padding (`p-6`) and the className-merge
// behaviour match the Classic card, so callers that override padding/layout (e.g. `p-0`,
// `max-w-md`) behave identically in both themes.

export function MaterialCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Paper
      elevation={4}
      className={cn('p-6', className)}
      sx={{ borderRadius: 3, backgroundImage: 'none' }}
      {...props}
    />
  );
}
