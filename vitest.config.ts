import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '../utils/calculations.js': '../utils/calculations.ts',
      '../utils/constants.js': '../utils/constants.ts',
      '../utils/skills.js': '../utils/skills.ts',
    },
  },
});
