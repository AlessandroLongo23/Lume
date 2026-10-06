// Leaves the demo salon as a recording found it. Tours create real rows through
// the UI (a client, a fiche, a coupon), and some scenarios seed rows first.
// `snapshot` notes what exists just before a run; `restore` deletes whatever
// appeared since, in the demo salon only.

// Children first, so no delete trips a foreign key.
const TABLES = [
  'fiche_payments', 'fiche_services', 'fiches', 'abbonamenti', 'coupons',
  'order_products', 'orders', 'service_products', 'operator_services', 'services',
  'service_categories', 'products', 'product_categories', 'manufacturers', 'suppliers',
  'operators', 'clients', 'notifications', 'activity_log',
];

// Tables with no `created_at`: their rows go with the parent row they point at.
const CHILDREN = {
  fiches: [['fiche_products', 'fiche_id'], ['fiche_edits', 'fiche_id'], ['coupon_redemptions', 'fiche_id']],
  coupons: [['coupon_redemptions', 'coupon_id']],
  products: [['product_price_history', 'product_id']],
  services: [['service_price_history', 'service_id']],
};

// How far back to look. Wide enough to absorb clock skew between this machine
// and the database; rows already present in the snapshot are never touched.
const WINDOW_MS = 10 * 60 * 1000;

async function recent(db, salonId, table, since) {
  const { data, error } = await db.from(table).select('id').eq('salon_id', salonId).gte('created_at', since);
  if (error) throw new Error(`${table}: ${error.message}`);
  return data.map((row) => row.id);
}

export async function snapshot(db, salonId) {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const existing = {};
  for (const table of TABLES) existing[table] = new Set(await recent(db, salonId, table, since));
  return { since, existing };
}

/** Deletes rows created since `snap`. Returns `{ table: count }` for what it removed. */
export async function restore(db, salonId, snap) {
  const fresh = {};
  for (const table of TABLES) {
    fresh[table] = (await recent(db, salonId, table, snap.since)).filter((id) => !snap.existing[table].has(id));
  }
  const removed = {};
  for (const table of TABLES) {
    const ids = fresh[table];
    if (ids.length === 0) continue;
    for (const [child, fk] of CHILDREN[table] ?? []) {
      const { error } = await db.from(child).delete().eq('salon_id', salonId).in(fk, ids);
      if (error) throw new Error(`${child}: ${error.message}`);
    }
    const { error } = await db.from(table).delete().eq('salon_id', salonId).in('id', ids);
    if (error) throw new Error(`${table}: ${error.message}`);
    removed[table] = ids.length;
  }
  return removed;
}
