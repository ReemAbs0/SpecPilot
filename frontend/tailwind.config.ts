import type { Config } from 'tailwindcss';

// Design tokens derived from the approved Figma screens (see plan.md "Design system
// considerations"). Components MUST pull from these tokens rather than hard-coding hex
// values, so the palette/spacing stays consistent across all four screens.
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Dark mode (feature/dark-mode) is opt-in via a `.dark` class on <html>, toggled by
  // ThemeModeProvider from the persisted `colorMode`. This keeps the Classic (Tailwind) light
  // theme byte-identical unless dark mode is explicitly selected, and stays independent of the
  // Classic/Material design-system axis.
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        // Indigo/violet primary used for CTAs, links, and active states (#4F46E5 family).
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Near-white and light-lavender page/card backgrounds.
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f7fb',
          lavender: '#f1f0fb',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 8px 24px rgba(16, 24, 40, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
