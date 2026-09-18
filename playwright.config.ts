import { defineConfig } from '@playwright/test';

const testUrl = process.env.PIP_TEST_URL;
const localUrl = 'http://localhost:3173';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'artifacts/playwright-report' }]],
  use: {
    baseURL: testUrl || localUrl,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.platform === 'darwin'
      ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
      : {},
  },
  webServer: testUrl ? undefined : {
    command: 'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3173',
    env: {
      AI_PROVIDER: 'demo',
      DEMO_MODE: 'true',
      PIP_STRICT_LOCAL_AI: 'false',
      ALLOW_CLOUD_FALLBACK: 'false',
      AI_TIMEOUT_MS: '3500',
    },
    url: localUrl,
    // Never silently test another checkout that happens to own the same port.
    reuseExistingServer: false,
    timeout: 60000,
  },
  outputDir: 'artifacts/test-results',
});
