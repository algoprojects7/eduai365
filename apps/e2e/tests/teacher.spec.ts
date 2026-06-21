import { expect, test } from '@playwright/test';
import { demoCredentials } from '../src/config/urls';
import { loginViaPortalForm } from '../src/helpers/login';

test.describe('Teacher portal', () => {
  test('teacher can sign in and reach the dashboard', async ({ page }) => {
    await page.goto(`/login?role=TEACHER&school=${demoCredentials.schoolSlug}`);

    await expect(page.getByRole('heading', { name: /eduAI365/i })).toBeVisible();
    await expect(page.getByText(/Teacher Portal/i)).toBeVisible();

    await loginViaPortalForm(page, {
      email: demoCredentials.teacher,
      password: demoCredentials.password,
      schoolSlug: demoCredentials.schoolSlug,
    });

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /Teacher Dashboard/i })).toBeVisible();
  });
});
