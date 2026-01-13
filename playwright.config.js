// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    baseURL: 'http://localhost:3000'
  },
  webServer: {
    command: 'npx http-server -c-1 -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: process.env.CI ? false : true,
    timeout: 30 * 1000
  }
});