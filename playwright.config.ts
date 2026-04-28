import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test' });

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const auth = (role: string) => path.join('playwright/.auth', `${role}.json`);

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'anon',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /(smoke|auth)\.spec\.ts/,
    },
    {
      name: 'owner',
      use: { ...devices['Desktop Chrome'], storageState: auth('owner') },
      dependencies: ['setup'],
      testMatch: /admin\/.*\.spec\.ts/,
    },
    {
      name: 'operator',
      use: { ...devices['Desktop Chrome'], storageState: auth('operator') },
      dependencies: ['setup'],
      testIgnore: /admin\/.*\.spec\.ts/,
    },
    {
      name: 'admin',
      use: { ...devices['Desktop Chrome'], storageState: auth('admin') },
      dependencies: ['setup'],
      testIgnore: /admin\/.*\.spec\.ts/,
    },
    {
      name: 'client',
      use: { ...devices['Desktop Chrome'], storageState: auth('client') },
      dependencies: ['setup'],
      testIgnore: /admin\/.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
