import { test as setup, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { testEnv, type TestRole } from '../fixtures/test-env';

const authFile = (role: TestRole) => path.join('playwright/.auth', `${role}.json`);

async function performLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email o telefono').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Accedi' }).click();
}

setup('authenticate as admin', async ({ page }) => {
  await performLogin(page, testEnv.roles.admin.email, testEnv.roles.admin.password);
  // Admin lands on /platform when there are no business/client links.
  // If multi-role, lands on /select-workspace.
  await expect(page).toHaveURL(/\/(platform|select-workspace)/);
  await page.context().storageState({ path: authFile('admin') });
});

setup('authenticate as owner', async ({ page }) => {
  await performLogin(page, testEnv.roles.owner.email, testEnv.roles.owner.password);
  // Owner with one salon → /admin/calendario; multiple → /select-salon.
  await expect(page).toHaveURL(/\/(admin|select-salon|select-workspace)/);
  await page.context().storageState({ path: authFile('owner') });
});

setup('authenticate as operator', async ({ page }) => {
  await performLogin(page, testEnv.roles.operator.email, testEnv.roles.operator.password);
  await expect(page).toHaveURL(/\/(admin|select-salon|select-workspace)/);
  await page.context().storageState({ path: authFile('operator') });
});

setup('authenticate as client', async ({ page }) => {
  await performLogin(page, testEnv.roles.client.email, testEnv.roles.client.password);
  await expect(page).toHaveURL(/\/(client-dashboard|select-workspace)/);
  await page.context().storageState({ path: authFile('client') });
});
