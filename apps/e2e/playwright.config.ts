import { defineConfig, devices } from '@playwright/test';
import { urls } from './src/config/urls';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'landing',
      testMatch: /landing\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.landing,
      },
    },
    {
      name: 'school-admin',
      testMatch: /school-admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.school,
      },
    },
    {
      name: 'teacher',
      testMatch: /teacher\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.teacher,
      },
    },
    {
      name: 'parent',
      testMatch: /parent\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: urls.parent,
      },
    },
  ],
});
