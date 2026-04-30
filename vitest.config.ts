import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@shared': path.resolve('./src/shared'),
      '@core': path.resolve('./src/core'),
      '@catalog': path.resolve('./src/catalog'),
      '@cli': path.resolve('./src/cli'),
      '@engine': path.resolve('./src/engine'),
      '@adapters': path.resolve('./src/adapters'),
      '@types': path.resolve('./src/types'),
    },
  },
})
