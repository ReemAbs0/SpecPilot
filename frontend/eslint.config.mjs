import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

// Frontend ESLint flat config. Same typescript-eslint base and Prettier compatibility as
// the backend (T004), plus React-specific rules. Formatting is owned by the shared root
// Prettier config; eslint-config-prettier disables conflicting stylistic rules.
export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Build/config files run in Node, not the browser.
    files: ['*.config.{ts,js,mjs}'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    // Context modules idiomatically co-locate their Provider component with the access hook;
    // the fast-refresh rule doesn't apply to this intentional pattern.
    files: ['src/state/SpecificationContext.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  prettier,
);
