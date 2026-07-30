import { createTheme } from '@mui/material/styles';

// Material UI theme for the 'material' design mode (feature/material-theme). It keeps the brand
// palette (indigo/violet primary, Inter typeface) so the app stays on-brand, but deliberately
// leans into Material's own visual language — rounded surfaces, real elevation/shadows, ripples,
// and a coloured AppBar — so the Material theme is immediately recognisable and clearly distinct
// from the flat, bordered Classic (Tailwind) look. Only Material-mode components consume this.
export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      light: '#818cf8', // brand-400
      main: '#4f46e5', // brand-600
      dark: '#4338ca', // brand-700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed',
    },
    background: {
      default: '#eef0f8', // a touch cooler than Classic's surface so the page reads differently
      paper: '#ffffff',
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
    button: { fontWeight: 600 },
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
  },
  shape: {
    // Rounder than the Classic surfaces, a recognisable Material 3 cue.
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: false },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          // A stronger, coloured shadow so filled primary buttons read as elevated Material.
          '&.MuiButton-containedPrimary': {
            boxShadow: '0 6px 16px rgba(79, 70, 229, 0.30)',
            '&:hover': { boxShadow: '0 8px 20px rgba(79, 70, 229, 0.38)' },
          },
        },
        sizeLarge: { paddingTop: 12, paddingBottom: 12, paddingLeft: 22, paddingRight: 22 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // MUI paints an overlay gradient on elevated paper in dark mode; disabling it keeps our
        // surfaces clean and predictable.
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { backgroundColor: '#ffffff' },
      },
    },
  },
});
