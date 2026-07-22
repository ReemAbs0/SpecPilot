import { defineConfig } from 'vitest/config';

// Backend tests run in a Node environment (Express routes, orchestrator, agents).
// Per research.md #7, Vitest is the single test runner; Supertest drives HTTP contract tests.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
  },
});
