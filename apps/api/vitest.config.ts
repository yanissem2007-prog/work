import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    // Unit tests only — no DB/Redis. Integration tests would use a separate config.
    pool: 'forks'
  }
});
