import { SupabaseClient } from '@supabase/supabase-js';

type Admin = SupabaseClient;

async function run(
  step: string,
  p: PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  const { error } = await p;
  if (error) throw new Error(`${step}: ${error.message}`);
}

async function isAuthUserOrphaned(admin: Admin, userId: string): Promise<boolean> {
  const [
    { count: ownerCount },
    { count: operatorCount },
    { count: clientCount },
  ] = await Promise.all([
    admin.from('salons').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
    admin.from('operators').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  return ((ownerCount ?? 0) + (operatorCount ?? 0) + (clientCount ?? 0)) === 0;
}

/**
 * Hard-deletes a salon and every tenant-scoped row associated with it, then
 * garbage-collects the auth identities of former clients/operators that are
 * no longer referenced anywhere in the system. The former owner's auth
 * identity is NOT garbage-collected here — callers decide that separately,
 * because the self-delete and platform-delete flows handle it differently.
 *
 * Returns the salon's former owner_id so the caller can run its own
 * identity-orphan check on the owner.
 */
export async function deleteSalonCascade(
  salonId: string,
  admin: Admin,
): Promise<{ ownerId: string | null }> {
  const { data: salon, error: salonErr } = await admin
    .from('salons')
    .select('id, owner_id')
    .eq('id', salonId)
    .single();
  if (salonErr || !salon) throw new Error(`Salone non trovato: ${salonErr?.message ?? 'missing'}`);

  const ownerId: string | null = salon.owner_id ?? null;

  // ── 1. Fiche line items ────────────────────────────────────────────────
  const { data: fiches, error: ficheErr } = await admin
    .from('fiches')
    .select('id')
    .eq('salon_id', salonId);
  if (ficheErr) throw new Error(`fiches lookup: ${ficheErr.message}`);
  const ficheIds = (fiches ?? []).map((f: { id: string }) => f.id);

  if (ficheIds.length > 0) {
    await run('fiche_services', admin.from('fiche_services').delete().in('fiche_id', ficheIds));
    await run('fiche_products', admin.from('fiche_products').delete().in('fiche_id', ficheIds));
    await run('fiche_payments', admin.from('fiche_payments').delete().in('fiche_id', ficheIds));
  }

  // ── 2. Coupon usage history, then fiches themselves ───────────────────
  await run('coupon_redemptions', admin.from('coupon_redemptions').delete().eq('salon_id', salonId));
  await run('fiches',             admin.from('fiches').delete().eq('salon_id', salonId));

  // ── 3. Orders, spese, obiettivi, client_ratings, abbonamenti ──────────
  // Note: platform `reviews` are user-scoped (FK to auth.users), not salon-scoped,
  // so they are NOT deleted here — they cascade with the author's account instead.
  await run('orders',          admin.from('orders').delete().eq('salon_id', salonId));
  await run('spese',           admin.from('spese').delete().eq('salon_id', salonId));
  await run('obiettivi',       admin.from('obiettivi').delete().eq('salon_id', salonId));
  await run('client_ratings',  admin.from('client_ratings').delete().eq('salon_id', salonId));
  await run('abbonamenti',     admin.from('abbonamenti').delete().eq('salon_id', salonId));

  // ── 4. Coupons (after coupon_redemptions / abbonamenti) ───────────────
  await run('coupons', admin.from('coupons').delete().eq('salon_id', salonId));

  // ── 5. Catalog ────────────────────────────────────────────────────────
  await run('products',           admin.from('products').delete().eq('salon_id', salonId));
  await run('product_categories', admin.from('product_categories').delete().eq('salon_id', salonId));
  await run('services',           admin.from('services').delete().eq('salon_id', salonId));
  await run('service_categories', admin.from('service_categories').delete().eq('salon_id', salonId));
  await run('manufacturers',      admin.from('manufacturers').delete().eq('salon_id', salonId));
  await run('suppliers',          admin.from('suppliers').delete().eq('salon_id', salonId));

  // ── 6. Operators (collect user_ids first for later GC) ────────────────
  const { data: salonOperators, error: opLookupErr } = await admin
    .from('operators')
    .select('user_id')
    .eq('salon_id', salonId);
  if (opLookupErr) throw new Error(`operators lookup: ${opLookupErr.message}`);
  const operatorUserIds = [
    ...new Set(
      (salonOperators ?? [])
        .map((o: { user_id: string | null }) => o.user_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  await run('operators', admin.from('operators').delete().eq('salon_id', salonId));

  // ── 7. Clients (collect user_ids first for later GC) ──────────────────
  const { data: salonClients, error: cliLookupErr } = await admin
    .from('clients')
    .select('user_id')
    .eq('salon_id', salonId);
  if (cliLookupErr) throw new Error(`clients lookup: ${cliLookupErr.message}`);
  const clientUserIds = [
    ...new Set(
      (salonClients ?? [])
        .map((c: { user_id: string | null }) => c.user_id)
        .filter((id): id is string => id !== null),
    ),
  ];
  await run('client_categories', admin.from('client_categories').delete().eq('salon_id', salonId));
  await run('clients',           admin.from('clients').delete().eq('salon_id', salonId));

  // ── 8. Profiles for this salon (owner + operator profile rows) ────────
  await run('profiles', admin.from('profiles').delete().eq('salon_id', salonId));

  // ── 9. Referral credits on either side ────────────────────────────────
  await run(
    'referral_credits',
    admin.from('referral_credits').delete()
      .or(`referrer_salon_id.eq.${salonId},referred_salon_id.eq.${salonId}`),
  );

  // ── 10. The salon itself ──────────────────────────────────────────────
  await run('salons', admin.from('salons').delete().eq('id', salonId));

  // ── 11. GC former clients' and operators' auth identities if orphaned ─
  const candidateUserIds = [...new Set([...clientUserIds, ...operatorUserIds])];
  await Promise.all(
    candidateUserIds.map(async (userId) => {
      if (await isAuthUserOrphaned(admin, userId)) {
        await admin.auth.admin.deleteUser(userId);
      }
    }),
  );

  return { ownerId };
}

export { isAuthUserOrphaned };
