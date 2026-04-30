import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    reporters: ['default', 'html'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'test/**/*',
        'src/cli/commands/*.command.ts',
        'src/cli/output/print-plan.ts',
        'src/cli/output/printer.ts',
      ],
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
})
