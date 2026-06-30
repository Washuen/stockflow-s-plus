const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: [
        'src/server.js',
        'public/**',
        'scripts/**',
        'prisma/**',
        'tests/**',
        'playwright.config.js',
        'vite.config.js',
        'node_modules/**'
      ]
    }
  }
});