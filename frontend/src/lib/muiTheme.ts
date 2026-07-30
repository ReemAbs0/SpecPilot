import { createTheme } from '@mui/material/styles';

// Material UI theme for the 'material' design mode (feature/material-theme). It mirrors the
// existing brand tokens from tailwind.config.ts (indigo/violet primary, Inter typeface, soft
// rounded surfaces) so the Material theme stays on-brand and visually consistent with Classic
// rather than defaulting to MUI's stock blue. Only Material-mode components consume this.
export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#818cf8', // brand-400
      main: '#4f46e5', // brand-600
      dark: '#4338ca', // brand-700
      contrastText: '#ffffff',
    },
    background: {
      default: '#f6f7fb', // surface.muted
      paper: '#ffffff', // surface.DEFAULT
    },
    text: {
      primary: '#1e293b', // slate-800
      secondary: '#64748b', // slate-500
    },
    divider: '#e2e8f0', // slate-200
  },
  typography: {
    fontFamily: [
      'Inter',
      'system-ui',
      '-apple-system',
      'Segoe UI',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    // Matches the rounded-xl / rounded-2xl surfaces used throughout the Classic UI.
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
  },
});
