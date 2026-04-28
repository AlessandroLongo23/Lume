import { test, expect } from '@playwright/test';
import { setActiveSalonCookie } from '../../fixtures/salon';
import {
  cleanupTestClients,
  createTestClient,
  deleteClientById,
  type CreatedClientRow,
} from '../../fixtures/seed';

test.describe('admin/clienti CRUD via seed', () => {
  test.beforeAll(async () => {
    // Safety net — wipe any leftover __E2E__-tagged rows from prior crashes.
    await cleanupTestClients();
  });

  test('a seeded client appears in the clients list', async ({ page, context }) => {
    await setActiveSalonCookie(context);

    let created: CreatedClientRow | null = null;
    const firstName = `__E2E__Mario`;
    const lastName  = `__E2E__Rossi-${Date.now()}`;

    try {
      created = await createTestClient({ firstName, lastName });

      await page.goto('/admin/clienti');
      // List loads from the clients Zustand store after mount.
      await expect(page.getByText(lastName)).toBeVisible({ timeout: 15_000 });
    } finally {
      if (created) await deleteClientById(created.id);
    }
  });
});
