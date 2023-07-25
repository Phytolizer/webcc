import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['test/setup.ts'],
    chaiConfig: {
      truncateThreshold: 0
    }
  }
})
