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
      // App Router uses root layout.tsx, not pages/_document.js — rule is N/A
      '@next/next/no-page-custom-font': 'off',
      // display=block is correct for icon fonts (must render or nothing)
      '@next/next/google-font-display': 'off',
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
