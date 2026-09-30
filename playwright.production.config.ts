import { defineConfig } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL?.startsWith('https://')) throw new Error('Set E2E_BASE_URL to the production HTTPS URL');

export default defineConfig({
  testDir: './tests/production',
  workers: 1,
  timeout: 180_000,
  use: { baseURL, channel: 'chrome', screenshot: 'only-on-failure', trace: 'off' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 375, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
