-- fiche_products.final_price is the LINE TOTAL (all pieces), exact to the cent.
--
-- It was ambiguous: the fiche modal saved the line total while every reader multiplied
-- by quantity again (double counting any line with quantity > 1). A unit price cannot be
-- stored exactly in numeric(10,2) (3 pieces for 11.00 -> 3.67 x 3 = 11.01), so the line
-- total is the canonical value; list_price stays the price of one piece. Readers here,
-- and in the app, sum final_price and never multiply it by quantity.
--
-- Data: the only rows with quantity > 1 at the time of this change were imported from
-- the previous CRM for one salon and are rewritten to their exact line totals by the
-- import tooling, not by this migration.

create or replace view public.client_stats with (security_invoker = true) as
 WITH past_fiches AS (
         SELECT f.id, f.client_id, f.salon_id, f.datetime,
            COALESCE(f.total_override,
              COALESCE((SELECT sum(fs.final_price) FROM fiche_services fs WHERE fs.fiche_id = f.id), 0::numeric)
            + COALESCE((SELECT sum(fp.final_price) FROM fiche_products fp WHERE fp.fiche_id = f.id), 0::numeric)) AS total
           FROM fiches f
          WHERE f.client_id IS NOT NULL AND f.datetime IS NOT NULL AND f.datetime <= now()
        ), agg AS (
         SELECT past_fiches.client_id, past_fiches.salon_id,
            sum(past_fiches.total) AS total_spent,
            count(*)::integer AS visit_count,
            min(past_fiches.datetime) AS first_visit,
            max(past_fiches.datetime) AS last_visit
           FROM past_fiches
          GROUP BY past_fiches.client_id, past_fiches.salon_id
        ), service_counts AS (
         SELECT f.client_id, fs.service_id, max(fs.name) AS service_name, count(*) AS cnt
           FROM fiches f JOIN fiche_services fs ON fs.fiche_id = f.id
          WHERE f.client_id IS NOT NULL AND f.datetime IS NOT NULL AND f.datetime <= now() AND fs.service_id IS NOT NULL
          GROUP BY f.client_id, fs.service_id
        ), top_service AS (
         SELECT DISTINCT ON (service_counts.client_id) service_counts.client_id,
            service_counts.service_id AS top_service_id, service_counts.service_name AS top_service_name
           FROM service_counts
          ORDER BY service_counts.client_id, service_counts.cnt DESC, service_counts.service_name
        ), operator_counts AS (
         SELECT f.client_id, fs.operator_id, (o."firstName" || ' '::text) || o."lastName" AS operator_name, count(*) AS cnt
           FROM fiches f JOIN fiche_services fs ON fs.fiche_id = f.id JOIN operators o ON o.id = fs.operator_id
          WHERE f.client_id IS NOT NULL AND f.datetime IS NOT NULL AND f.datetime <= now() AND fs.operator_id IS NOT NULL
          GROUP BY f.client_id, fs.operator_id, o."firstName", o."lastName"
        ), top_operator AS (
         SELECT DISTINCT ON (operator_counts.client_id) operator_counts.client_id,
            operator_counts.operator_id AS top_operator_id, operator_counts.operator_name AS top_operator_name
           FROM operator_counts
          ORDER BY operator_counts.client_id, operator_counts.cnt DESC, operator_counts.operator_name
        )
 SELECT a.client_id, a.salon_id, a.total_spent, a.visit_count, a.first_visit, a.last_visit,
        CASE WHEN a.visit_count > 0 THEN a.total_spent / a.visit_count::numeric ELSE 0::numeric END AS avg_ticket,
        ts.top_service_id, ts.top_service_name, too.top_operator_id, too.top_operator_name
   FROM agg a
     LEFT JOIN top_service ts ON ts.client_id = a.client_id
     LEFT JOIN top_operator too ON too.client_id = a.client_id;

create or replace view public.client_ratings with (security_invoker = true) as
 WITH window_fiches AS (
         SELECT f.id, f.client_id, f.salon_id,
            COALESCE(f.total_override,
              COALESCE((SELECT sum(fs.final_price) FROM fiche_services fs WHERE fs.fiche_id = f.id), 0::numeric)
            + COALESCE((SELECT sum(fp.final_price) FROM fiche_products fp WHERE fp.fiche_id = f.id), 0::numeric)) AS total
           FROM fiches f
          WHERE f.datetime >= (now() - '1 year'::interval) AND f.client_id IS NOT NULL
        ), per_client AS (
         SELECT window_fiches.client_id, window_fiches.salon_id,
            sum(window_fiches.total) AS total_spent, count(*)::integer AS visit_count
           FROM window_fiches
          GROUP BY window_fiches.client_id, window_fiches.salon_id
        )
 SELECT client_id, salon_id, total_spent, visit_count,
    ntile(5) OVER (PARTITION BY salon_id ORDER BY total_spent) AS spend_stars,
    ntile(5) OVER (PARTITION BY salon_id ORDER BY visit_count) AS visit_stars
   FROM per_client;

CREATE OR REPLACE FUNCTION public.platform_salon_stats(p_salon_ids uuid[], p_month_start timestamp with time zone)
 RETURNS TABLE(salon_id uuid, clients_count bigint, fiches_this_month bigint, services_revenue numeric, products_revenue numeric)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  with
    cc as (
      select salon_id, count(*) as cnt from clients where salon_id = any(p_salon_ids) group by salon_id
    ),
    fc as (
      select salon_id, count(*) as cnt from fiches
      where salon_id = any(p_salon_ids) and datetime >= p_month_start group by salon_id
    ),
    sr as (
      select salon_id, coalesce(sum(final_price), 0) as rev from fiche_services
      where salon_id = any(p_salon_ids) and start_time >= p_month_start group by salon_id
    ),
    pr as (
      select fp.salon_id, coalesce(sum(fp.final_price), 0) as rev
      from fiche_products fp join fiches f on f.id = fp.fiche_id
      where fp.salon_id = any(p_salon_ids) and f.datetime >= p_month_start
      group by fp.salon_id
    )
  select s.id, coalesce(cc.cnt, 0), coalesce(fc.cnt, 0), coalesce(sr.rev, 0), coalesce(pr.rev, 0)
  from unnest(p_salon_ids) as s(id)
  left join cc on cc.salon_id = s.id
  left join fc on fc.salon_id = s.id
  left join sr on sr.salon_id = s.id
  left join pr on pr.salon_id = s.id
$function$;

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
    select fi.giorno, 'prodotti', fp.final_price::numeric
    from fiche_in fi join public.fiche_products fp on fp.fiche_id = fi.id
    union all
    -- manual fiche total: the gap between the set total and its lines
    select fi.giorno, 'sconti',
           fi.total_override - (
             coalesce((select sum(fs.final_price) from public.fiche_services fs where fs.fiche_id = fi.id), 0)
           + coalesce((select sum(fp.final_price) from public.fiche_products fp where fp.fiche_id = fi.id), 0))
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
    select s.data as giorno, s.categoria, public.bilancio_voce_spesa(s.categoria) as voce,
           s.importo as lordo, coalesce(s.imponibile, s.importo) as netto
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
      'voci', coalesce((select jsonb_object_agg(voce, jsonb_build_object('lordo', l, 'netto', n))
                        from (select voce, sum(lordo) l, sum(netto) n from spese_in group by voce) v), '{}'::jsonb),
      'categorie', coalesce((select jsonb_agg(jsonb_build_object('categoria', categoria, 'voce', voce, 'lordo', l, 'netto', n) order by n desc)
                             from (select categoria, voce, sum(lordo) l, sum(netto) n from spese_in group by categoria, voce) c), '[]'::jsonb),
      'lordo', coalesce((select sum(lordo) from spese_in), 0),
      'netto', coalesce((select sum(netto) from spese_in), 0)
    ),
    'utile', jsonb_build_object(
      'netto', coalesce((select sum(netto) from righe_nette), 0) - coalesce((select sum(netto) from spese_in), 0),
      'lordo', coalesce((select sum(lordo) from righe_nette), 0) - coalesce((select sum(lordo) from spese_in), 0)
    ),
    'mesi', coalesce((
      select jsonb_agg(jsonb_build_object(
        'mese', mm.mese,
        'entrate_lordo', coalesce((select sum(lordo) from righe_nette r where to_char(r.giorno, 'YYYY-MM') = mm.mese), 0),
        'entrate_netto', coalesce((select sum(netto) from righe_nette r where to_char(r.giorno, 'YYYY-MM') = mm.mese), 0),
        'uscite_lordo', coalesce((select sum(lordo) from spese_in s where to_char(s.giorno, 'YYYY-MM') = mm.mese), 0),
        'uscite_netto', coalesce((select sum(netto) from spese_in s where to_char(s.giorno, 'YYYY-MM') = mm.mese), 0)
      ) order by mm.mese)
      from mesi mm), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

