import nextConfig from 'eslint-config-next'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    settings: {
      react: { version: '19' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  {
    ignores: ['.next/**', '.vercel/**', 'node_modules/**', 'public/meals/**'],
  },
  {
    files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', '**/*.test.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]

export default config
