import { createTheme, type ThemeOptions } from '@mui/material/styles';

// Material UI themes for the 'material' design mode. The base options keep the brand palette
// (indigo/violet primary, Inter typeface) and Material's own visual language — rounded surfaces,
// real elevation/shadows, ripples, a coloured AppBar — so the Material theme stays on-brand and
// clearly distinct from the flat, bordered Classic (Tailwind) look. Only Material-mode components
// consume these themes.
//
// feature/dark-mode: colour mode is a separate axis, so we export a light AND a dark theme built
// from the same shared options; App picks one based on the persisted `colorMode`. MUI derives the
// dark surfaces/text/dividers from `palette.mode: 'dark'`, so dark support is mostly declarative.

// Shared, colour-mode-independent options (typography, shape, component shape overrides).
const baseOptions: ThemeOptions = {
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
  },
};

// Light Material theme (default).
export const muiTheme = createTheme({
  ...baseOptions,
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
  components: {
    ...baseOptions.components,
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { backgroundColor: '#ffffff' },
      },
    },
  },
});

// Dark Material theme (feature/dark-mode). Keeps the brand primary (lightened slightly so it
// reads on dark surfaces) and swaps to Material's dark neutrals for backgrounds/text/dividers.
export const muiThemeDark = createTheme({
  ...baseOptions,
  palette: {
    mode: 'dark',
    primary: {
      light: '#a5b4fc', // brand-300
      main: '#818cf8', // brand-400 — brighter than the light theme so it pops on dark surfaces
      dark: '#6366f1', // brand-500
      contrastText: '#0b1020',
    },
    secondary: {
      main: '#a78bfa', // violet-400
    },
    background: {
      default: '#0f1729', // deep slate, cooler than pure black to match the brand
      paper: '#1a2337', // elevated surface, distinct from the page background
    },
    text: {
      primary: '#e2e8f0', // slate-200
      secondary: '#94a3b8', // slate-400
    },
    divider: '#334155', // slate-700
  },
  components: {
    ...baseOptions.components,
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: { backgroundColor: '#1a2337' },
      },
    },
  },
});
