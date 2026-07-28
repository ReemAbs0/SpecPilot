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
    // Dummy Firebase Web config so `getAuth` (called at import of src/lib/firebase.ts) can
    // initialize in jsdom without a real project. Tests never make real auth calls.
    env: {
      VITE_FIREBASE_API_KEY: 'test-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'test-project',
      VITE_FIREBASE_APP_ID: 'test-app-id',
    },
  },
});
