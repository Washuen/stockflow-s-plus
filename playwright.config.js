const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3333',
    extraHTTPHeaders: {
      'Content-Type': 'application/json'
    }
  }
});
