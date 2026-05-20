# Demo-salon seed recipes

How to make the demo salon rich enough that any tutorial's feature is reachable for screenshots. These
are **templates** — confirm exact column names against the type model (`src/lib/types/<Entity>.ts`) and
the working inserts in `tests/fixtures/seed.ts` before running.

## Golden rules

1. **Scope to the demo salon only.** Use the literal `salon_id = '<E2E_TEST_SALON_ID>'` (read from
   `.env.test`). That id *is* the demo salon, so scoping to it is the demo-only guarantee. Before the
   first write, sanity-check the value equals `E2E_TEST_SALON_ID`.
2. **Idempotent.** Guard every insert with `WHERE NOT EXISTS (…)` on a stable natural key so re-runs
   insert nothing.
3. **Additive only.** Never `UPDATE`/`DELETE` existing rows. The demo salon accumulates content.
4. **Same database as the screenshots.** Only use `mcp__supabase__execute_sql` if
   `mcp__supabase__get_project_url` matches `NEXT_PUBLIC_SUPABASE_URL` in `.env.test`. Otherwise use the
   Node fallback below (service-role key from `.env.test`).

Throughout, `:salon` = the demo `salon_id` literal.

## Check what's missing (read-only)

```sql
select
  (select count(*) from clients      where salon_id = :salon) as clients,
  (select count(*) from services     where salon_id = :salon) as services,
  (select count(*) from operators    where salon_id = :salon) as operators,
  (select count(*) from coupons      where salon_id = :salon) as coupons,
  (select count(*) from coupons      where salon_id = :salon and kind = 'gift_card') as gift_cards,
  (select count(*) from fiches       where salon_id = :salon) as fiches,
  (select count(*) from abbonamenti  where salon_id = :salon) as abbonamenti;
```

Seed only the categories that come back as `0` (or below what the tutorial needs).

## Idempotent insert template

```sql
insert into <table> (salon_id, <cols…>)
select :salon, <values…>
where not exists (
  select 1 from <table>
  where salon_id = :salon and <natural-key predicate>
);
```

### Clients (root entity — needed by coupons, fiches, abbonamenti)

```sql
insert into clients (salon_id, first_name, last_name)
select :salon, 'Giulia', 'Demo'
where not exists (
  select 1 from clients where salon_id = :salon and first_name = 'Giulia' and last_name = 'Demo'
);
```

### Coupon / discount (needs a recipient client)

Resolve a recipient first, then insert idempotently. `Coupon` requires `recipient_client_id`,
`kind` (`'gift' | 'gift_card'`), `discount_type` (`'fixed' | 'percent' | 'free_item'`), and the
validity window `valid_from` / `valid_until`. Check `src/lib/types/Coupon.ts` for the full column list.

```sql
with recipient as (
  select id from clients where salon_id = :salon order by created_at limit 1
)
insert into coupons (salon_id, kind, recipient_client_id, discount_type, discount_value,
                     valid_from, valid_until, is_active)
select :salon, 'gift', recipient.id, 'percent', 20,
       now(), now() + interval '1 year', true
from recipient
where not exists (
  select 1 from coupons
  where salon_id = :salon and discount_type = 'percent' and discount_value = 20
);
```

### Gift card (a `kind = 'gift_card'` coupon with a balance)

```sql
with recipient as (
  select id from clients where salon_id = :salon order by created_at limit 1
)
insert into coupons (salon_id, kind, recipient_client_id, discount_type,
                     original_value, remaining_value, valid_from, valid_until, is_active)
select :salon, 'gift_card', recipient.id, 'fixed', 50, 50,
       now(), now() + interval '1 year', true
from recipient
where not exists (
  select 1 from coupons where salon_id = :salon and kind = 'gift_card' and original_value = 50
);
```

### Abbonamento (needs a client; usually a service)

Confirm columns against `src/lib/types/Abbonamento.ts` and the `abbonamenti` store. Pattern:

```sql
with c as (select id from clients where salon_id = :salon order by created_at limit 1)
insert into abbonamenti (salon_id, client_id, <cols…>)
select :salon, c.id, <values…>
from c
where not exists (
  select 1 from abbonamenti where salon_id = :salon and <natural-key>
);
```

### Fiche (appointment — needs client + service + operator)

A fiche plus its service line is two inserts (`fiches`, then `fiche_services`). Read `Fiche.ts` and
`FicheService.ts` / `FicheDraft.ts` for required columns (`client_id`, `datetime`, `status`; line
`service_id`, `operator_id`, `start_time`, `duration`, prices). Build the parent, then the line
referencing the new fiche id. Guard the parent on a recognizable `note`/`datetime` natural key.

## Node fallback (when the MCP project ≠ `.env.test` project)

Run a one-off script with the service-role key from `.env.test` so the seed hits the same DB as the
screenshots. Mirror `tests/fixtures/seed.ts`:

```ts
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.test' });

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } });
const salon = process.env.E2E_TEST_SALON_ID!;

// Pre-check then insert only if absent — keep it idempotent, same as the SQL guards above.
const { count } = await db.from('coupons').select('*', { count: 'exact', head: true }).eq('salon_id', salon);
if (!count) {
  const { data: client } = await db.from('clients').select('id').eq('salon_id', salon).limit(1).single();
  await db.from('coupons').insert({
    salon_id: salon, kind: 'gift', recipient_client_id: client!.id,
    discount_type: 'percent', discount_value: 20,
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 365 * 864e5).toISOString(), is_active: true,
  });
}
```

Run with `npx tsx <file>` (or place it under `scripts/` temporarily and delete after). The service-role
key bypasses RLS, so the `salon_id` scoping is your only guard — keep it on every statement.
