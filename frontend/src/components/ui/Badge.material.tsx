import Chip from '@mui/material/Chip';
import type { BadgeVariant } from './Badge';

// Material (MUI) badge/pill. Renders an MUI <Chip> styled with the same soft brand/neutral
// tokens the Classic badge uses, so the "AI Powered" / "Generated Successfully" pills keep their
// look while being a genuine Material component. The badge content (icon + text) is passed as the
// Chip label.

// Soft brand/neutral tones per colour mode. Light keeps the original brand-50 / slate-100 pills;
// dark uses translucent tints with lightened text so the pills read on dark surfaces. Keyed off
// the MUI palette mode (theme.palette.mode) so it follows Material Light/Dark automatically.
type Tone = { bg: string; color: string };
const lightPalette: Record<BadgeVariant, Tone> = {
  brand: { bg: '#eef2ff', color: '#4338ca' }, // brand-50 / brand-700
  success: { bg: '#eef2ff', color: '#4338ca' },
  neutral: { bg: '#f1f5f9', color: '#475569' }, // slate-100 / slate-600
};
const darkPalette: Record<BadgeVariant, Tone> = {
  brand: { bg: 'rgba(129, 140, 248, 0.16)', color: '#a5b4fc' }, // brand-400 tint / brand-300
  success: { bg: 'rgba(129, 140, 248, 0.16)', color: '#a5b4fc' },
  neutral: { bg: 'rgba(148, 163, 184, 0.16)', color: '#cbd5e1' }, // slate-400 tint / slate-300
};

export interface MaterialBadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

export function MaterialBadge({ variant = 'brand', className, children }: MaterialBadgeProps) {
  return (
    <Chip
      size="small"
      className={className}
      label={children}
      sx={(theme) => {
        const tone = (theme.palette.mode === 'dark' ? darkPalette : lightPalette)[variant];
        return {
          backgroundColor: tone.bg,
          color: tone.color,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 'auto',
          py: 0.5,
          '& .MuiChip-label': {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.25,
          },
        };
      }}
    />
  );
}
