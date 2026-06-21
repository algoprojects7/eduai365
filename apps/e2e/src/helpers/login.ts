import type { Page } from '@playwright/test';

export interface PortalLoginOptions {
  email: string;
  password: string;
  schoolSlug?: string;
}

export async function loginViaPortalForm(
  page: Page,
  { email, password, schoolSlug }: PortalLoginOptions,
): Promise<void> {
  if (schoolSlug) {
    await page.getByLabel(/school slug/i).fill(schoolSlug);
  }

  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}
