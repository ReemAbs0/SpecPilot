import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Frontend tests run in a jsdom environment with React Testing Library (research.md #7).
// A separate vitest.config.ts (not merged from vite.config.ts) means the React plugin must
// be declared here too so JSX is transformed in tests.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
