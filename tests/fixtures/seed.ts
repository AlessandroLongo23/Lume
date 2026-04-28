import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { testEnv } from './test-env';

const E2E_PREFIX = '__E2E__';

let cached: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(testEnv.supabaseUrl, testEnv.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function testTag(): string {
  return `${E2E_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface CreatedClientRow {
  id: string;
  salon_id: string;
}

export async function createTestClient(input?: {
  firstName?: string;
  lastName?: string;
}): Promise<CreatedClientRow> {
  const tag = testTag();
  const { data, error } = await adminClient()
    .from('clients')
    .insert({
      salon_id: testEnv.testSalonId,
      first_name: input?.firstName ?? `${E2E_PREFIX}First-${tag}`,
      last_name: input?.lastName ?? `${E2E_PREFIX}Last-${tag}`,
    })
    .select('id, salon_id')
    .single();

  if (error) throw new Error(`createTestClient failed: ${error.message}`);
  return data as CreatedClientRow;
}

export async function deleteClientById(id: string): Promise<void> {
  const { error } = await adminClient()
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('salon_id', testEnv.testSalonId);
  if (error) throw new Error(`deleteClientById failed: ${error.message}`);
}

/**
 * Removes any rows in `clients` for the test salon whose first_name or last_name
 * starts with the E2E prefix. Safety net for tests that crash mid-run.
 */
export async function cleanupTestClients(): Promise<void> {
  const { error } = await adminClient()
    .from('clients')
    .delete()
    .eq('salon_id', testEnv.testSalonId)
    .or(`first_name.like.${E2E_PREFIX}%,last_name.like.${E2E_PREFIX}%`);
  if (error) throw new Error(`cleanupTestClients failed: ${error.message}`);
}
