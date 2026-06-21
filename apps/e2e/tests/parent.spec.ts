import { expect, test } from '@playwright/test';
import { demoCredentials } from '../src/config/urls';
import { loginViaPortalForm } from '../src/helpers/login';

test.describe('Parent portal', () => {
  test('parent can sign in and reach the dashboard', async ({ page }) => {
    await page.goto(`/login?role=PARENT&school=${demoCredentials.schoolSlug}`);

    await expect(page.getByRole('heading', { name: /eduAI365/i })).toBeVisible();
    await expect(page.getByText(/Parent Portal/i)).toBeVisible();

    await loginViaPortalForm(page, {
      email: demoCredentials.parent,
      password: demoCredentials.password,
      schoolSlug: demoCredentials.schoolSlug,
    });

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Parent Dashboard/i })).toBeVisible();
  });
});
