import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/__tests__/**', 'stores/__tests__/**', 'hooks/__tests__/**'],
    exclude: ['node_modules', 'api/', '.expo/'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
