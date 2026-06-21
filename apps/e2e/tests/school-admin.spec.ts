import { expect, test } from '@playwright/test';
import { demoCredentials } from '../src/config/urls';
import { loginViaPortalForm } from '../src/helpers/login';

test.describe('School admin portal', () => {
  test('principal can sign in and reach the dashboard', async ({ page }) => {
    await page.goto(`/login?role=PRINCIPAL&school=${demoCredentials.schoolSlug}`);

    await expect(page.getByRole('heading', { name: /eduAI365/i })).toBeVisible();
    await expect(page.getByText(/School Admin Portal/i)).toBeVisible();

    await loginViaPortalForm(page, {
      email: demoCredentials.principal,
      password: demoCredentials.password,
      schoolSlug: demoCredentials.schoolSlug,
    });

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Dashboard Overview/i })).toBeVisible();
  });
});
