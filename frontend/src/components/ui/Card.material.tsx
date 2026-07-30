import { type HTMLAttributes } from 'react';
import Paper from '@mui/material/Paper';
import { cn } from './cn';

// Material (MUI) card surface. Renders an elevated MUI <Paper> for the Material look while
// keeping the same default padding (`p-6`) and className-merge behaviour as the Classic card, so
// callers that override padding/layout (e.g. `p-0`, `max-w-md`) behave identically in both
// themes.

export function MaterialCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Paper
      elevation={1}
      className={cn('p-6', className)}
      sx={{ borderRadius: 2, backgroundImage: 'none' }}
      {...props}
    />
  );
}
