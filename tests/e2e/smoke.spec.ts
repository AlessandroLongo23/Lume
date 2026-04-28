import { test, expect } from '@playwright/test';

test.describe('public smoke', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('login page renders the form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Bentornato' })).toBeVisible();
    await expect(page.getByLabel('Email o telefono')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Accedi' })).toBeVisible();
  });

  test('admin route redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin/calendario');
    await expect(page).toHaveURL(/\/login/);
  });
});
