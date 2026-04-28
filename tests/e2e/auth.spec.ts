import { test, expect } from '@playwright/test';
import { testEnv } from '../fixtures/test-env';

test.describe('login redirects per role', () => {
  test('admin lands on /platform or /select-workspace', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email o telefono').fill(testEnv.roles.admin.email);
    await page.getByLabel('Password').fill(testEnv.roles.admin.password);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL(/\/(platform|select-workspace)/);
  });

  test('owner lands inside /admin or on a workspace picker', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email o telefono').fill(testEnv.roles.owner.email);
    await page.getByLabel('Password').fill(testEnv.roles.owner.password);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL(/\/(admin|select-salon|select-workspace)/);
  });

  test('client lands on /client-dashboard or /select-workspace', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email o telefono').fill(testEnv.roles.client.email);
    await page.getByLabel('Password').fill(testEnv.roles.client.password);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL(/\/(client-dashboard|select-workspace)/);
  });

  test('rejects invalid credentials with an Italian error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email o telefono').fill('not-a-real-user@lume-test.local');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page.getByText(/non corretti|non riuscito/i)).toBeVisible();
  });
});
