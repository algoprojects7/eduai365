import { expect, test } from '@playwright/test';
import { urls } from '../src/config/urls';

const ROLE_CARDS = [
  { title: 'Super Admin', hrefPattern: `${urls.admin}/login` },
  { title: 'Principal', hrefPattern: `${urls.school}/login?role=PRINCIPAL` },
  { title: 'Teacher', hrefPattern: `${urls.teacher}/login?role=TEACHER` },
  { title: 'Student', hrefPattern: `${urls.student}/login?role=STUDENT` },
  { title: 'Parent', hrefPattern: `${urls.parent}/login?role=PARENT` },
  { title: 'HR Admin', hrefPattern: `${urls.school}/login?role=HR_MANAGER` },
  { title: 'Librarian', hrefPattern: `${urls.school}/login?role=LIBRARIAN` },
  { title: 'Transport Manager', hrefPattern: `${urls.school}/login?role=TRANSPORT_MANAGER` },
  { title: 'Admission Officer', hrefPattern: `${urls.school}/login?role=RECEPTIONIST` },
] as const;

test.describe('Landing page', () => {
  test('loads and shows role portal section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Unified Experience for Every Role/i })).toBeVisible();
  });

  test('role cards link to the correct portal login URLs', async ({ page }) => {
    await page.goto('/');

    for (const card of ROLE_CARDS) {
      const link = page.getByRole('link', { name: new RegExp(card.title, 'i') });
      await expect(link).toBeVisible();

      const href = await link.getAttribute('href');
      expect(href, `${card.title} login href`).toContain(card.hrefPattern);
    }
  });
});
