import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import type { SpinnerProps } from './Spinner';

// Material (MUI) loading indicator. Uses MUI's <CircularProgress> with the same accessible
// label contract as the Classic spinner (visible text when `label` is set, otherwise an
// sr-only "Loading" for screen readers). The label uses the `text.secondary` theme token so it
// stays readable in both Material Light and Dark.

export function MaterialSpinner({ label, className }: SpinnerProps) {
  return (
    <Box
      component="span"
      role="status"
      className={className}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}
    >
      <CircularProgress size={16} thickness={5} aria-hidden="true" />
      <span className={label ? undefined : 'sr-only'}>{label ?? 'Loading'}</span>
    </Box>
  );
}
