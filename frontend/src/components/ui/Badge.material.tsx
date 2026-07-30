import Chip from '@mui/material/Chip';
import type { BadgeVariant } from './Badge';

// Material (MUI) badge/pill. Renders an MUI <Chip> styled with the same soft brand/neutral
// tokens the Classic badge uses, so the "AI Powered" / "Generated Successfully" pills keep their
// look while being a genuine Material component. The badge content (icon + text) is passed as the
// Chip label.

const palette: Record<BadgeVariant, { bg: string; color: string }> = {
  brand: { bg: '#eef2ff', color: '#4338ca' }, // brand-50 / brand-700
  success: { bg: '#eef2ff', color: '#4338ca' },
  neutral: { bg: '#f1f5f9', color: '#475569' }, // slate-100 / slate-600
};

export interface MaterialBadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children?: React.ReactNode;
}

export function MaterialBadge({ variant = 'brand', className, children }: MaterialBadgeProps) {
  const tone = palette[variant];
  return (
    <Chip
      size="small"
      className={className}
      label={children}
      sx={{
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
      }}
    />
  );
}
