-- Bilancio (profit and loss) for any date range, computed on the server.
--
-- Replaces the client-side calculation in stores/stats.ts, which summed the
-- current catalog price of every service on every fiche (discounts, products and
-- fiche status ignored) and only ever saw the last 90 days of data.
--
-- Rules, verified to the cent against Stiv's "Utile in corso" on 66 of 67 months
-- of real salon data (Jun 2021 - Dec 2026):
--
--   * Revenue comes only from fiches with status 'completed', placed on the day of
--     fiches.datetime in Europe/Rome.
--   * Services count at the price actually charged (fiche_services.final_price);
--     products at final_price * quantity (final_price is a unit price).
--   * A fiche with total_override contributes the difference between that total
--     and its lines to "sconti", so the fiche counts at the total that was set.
--   * Package (abbonamenti.total_paid) and gift-card (coupons.sale_amount) sales
--     count on their sale day. Coupon and gift-card redemptions are subtracted as
--     "sconti" (a gift card's money was already counted when it was sold).
--   * Net of VAT is computed line by line: round(gross / (1 + VAT%), 2), then summed.
--     VAT comes from salons.fiscal.default_iva_pct (22 when unset), 0 under the
--     flat-rate regime (regime = 'forfettario').
--   * Costs are public.spese in the range, by categoria, each rolled up into one of
--     six accounting headings (voce) that mirror Italian P&L lines B.6-B.14.
--
-- SECURITY INVOKER: callers only ever see rows RLS lets them see, so an
-- authenticated user passing another salon's id gets zeroes. p_salon_id defaults to
-- the caller's active salon; server-side callers (service role) pass it explicitly.

create or replace function public.bilancio_voce_spesa(p_categoria text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case lower(trim(coalesce(p_categoria, '')))
    when 'prodotti'            then 'acquisto_prodotti'
    when 'acquisto prodotti'   then 'acquisto_prodotti'
    when 'utenze'              then 'servizi_esterni'
    when 'manutenzione'        then 'servizi_esterni'
    when 'marketing'           then 'servizi_esterni'
    when 'consulenze'          then 'servizi_esterni'
    when 'servizi esterni'     then 'servizi_esterni'
    when 'affitto'             then 'affitti_noleggi'
    when 'noleggi'             then 'affitti_noleggi'
    when 'affitti e noleggi'   then 'affitti_noleggi'
    when 'personale'           then 'personale'
    when 'ammortamenti'        then 'ammortamenti'
    else 'altre_spese'
  end
$$;

create or replace function public.bilancio(
  p_from     date,
  p_to       date,
  p_salon_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_salon  uuid := coalesce(p_salon_id, public.get_user_salon_id());
  v_fiscal jsonb;
  v_iva    numeric;
  v_div    numeric;
  v_result jsonb;
begin
  if v_salon is null or p_from is null or p_to is null or p_to < p_from then
    return null;
  end if;

  select fiscal into v_fiscal from public.salons where id = v_salon;
  v_iva := case
    when v_fiscal ->> 'regime' = 'forfettario' then 0
    else coalesce(nullif(v_fiscal ->> 'default_iva_pct', '')::numeric, 22)
  end;
  v_div := 1 + v_iva / 100;

  with
  fiche_in as (
    select f.id, f.total_override,
           (f.datetime at time zone 'Europe/Rome')::date as giorno
    from public.fiches f
    where f.salon_id = v_salon
      and f.status = 'completed'
      and (f.datetime at time zone 'Europe/Rome')::date between p_from and p_to
  ),
  righe as (
    -- one row per revenue line: (giorno, voce, lordo)
    select fi.giorno, 'servizi'::text as voce, fs.final_price::numeric as lordo
    from fiche_in fi join public.fiche_services fs on fs.fiche_id = fi.id
    union all
    select fi.giorno, 'prodotti', (fp.final_price * fp.quantity)::numeric
    from fiche_in fi join public.fiche_products fp on fp.fiche_id = fi.id
    union all
    -- manual fiche total: the gap between the set total and its lines
    select fi.giorno, 'sconti',
           fi.total_override - (
             coalesce((select sum(fs.final_price) from public.fiche_services fs where fs.fiche_id = fi.id), 0)
           + coalesce((select sum(fp.final_price * fp.quantity) from public.fiche_products fp where fp.fiche_id = fi.id), 0))
    from fiche_in fi
    where fi.total_override is not null
    union all
    select fi.giorno, 'sconti', -cr.amount_applied
    from fiche_in fi join public.coupon_redemptions cr on cr.fiche_id = fi.id
    union all
    select (a.created_at at time zone 'Europe/Rome')::date, 'pacchetti', a.total_paid
    from public.abbonamenti a
    where a.salon_id = v_salon
      and (a.created_at at time zone 'Europe/Rome')::date between p_from and p_to
    union all
    select (c.created_at at time zone 'Europe/Rome')::date, 'buoni_venduti', c.sale_amount
    from public.coupons c
    where c.salon_id = v_salon and c.kind = 'gift_card' and c.sale_amount is not null
      and (c.created_at at time zone 'Europe/Rome')::date between p_from and p_to
  ),
  righe_nette as (
    select giorno, voce, lordo, round(lordo / v_div, 2) as netto from righe where lordo <> 0
  ),
  spese_in as (
    select s.data as giorno, s.categoria, public.bilancio_voce_spesa(s.categoria) as voce, s.importo
    from public.spese s
    where s.salon_id = v_salon and s.data between p_from and p_to
  ),
  entrate as (
    select voce, sum(lordo) as lordo, sum(netto) as netto from righe_nette group by voce
  ),
  mesi as (
    select to_char(date_trunc('month', m), 'YYYY-MM') as mese from generate_series(
      date_trunc('month', p_from::timestamp), date_trunc('month', p_to::timestamp), interval '1 month') m
  )
  select jsonb_build_object(
    'dal', p_from,
    'al', p_to,
    'iva_pct', v_iva,
    'entrate', jsonb_build_object(
      'voci', coalesce((select jsonb_object_agg(voce, jsonb_build_object('lordo', lordo, 'netto', netto)) from entrate), '{}'::jsonb),
      'lordo', coalesce((select sum(lordo) from righe_nette), 0),
      'netto', coalesce((select sum(netto) from righe_nette), 0)
    ),
    'uscite', jsonb_build_object(
      'voci', coalesce((select jsonb_object_agg(voce, tot) from (select voce, sum(importo) tot from spese_in group by voce) v), '{}'::jsonb),
      'categorie', coalesce((select jsonb_agg(jsonb_build_object('categoria', categoria, 'voce', voce, 'importo', tot) order by tot desc)
                             from (select categoria, voce, sum(importo) tot from spese_in group by categoria, voce) c), '[]'::jsonb),
      'totale', coalesce((select sum(importo) from spese_in), 0)
    ),
    'utile', jsonb_build_object(
      'netto', coalesce((select sum(netto) from righe_nette), 0) - coalesce((select sum(importo) from spese_in), 0),
      'lordo', coalesce((select sum(lordo) from righe_nette), 0) - coalesce((select sum(importo) from spese_in), 0)
    ),
    'mesi', coalesce((
      select jsonb_agg(jsonb_build_object(
        'mese', mm.mese,
        'entrate_lordo', coalesce((select sum(lordo) from righe_nette r where to_char(r.giorno, 'YYYY-MM') = mm.mese), 0),
        'entrate_netto', coalesce((select sum(netto) from righe_nette r where to_char(r.giorno, 'YYYY-MM') = mm.mese), 0),
        'uscite', coalesce((select sum(importo) from spese_in s where to_char(s.giorno, 'YYYY-MM') = mm.mese), 0)
      ) order by mm.mese)
      from mesi mm), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.bilancio(date, date, uuid) from public, anon;
grant execute on function public.bilancio(date, date, uuid) to authenticated, service_role;
grant execute on function public.bilancio_voce_spesa(text) to authenticated, service_role;
