-- Expenses gain a net amount, and the Bilancio uses it.
--
-- Stiv's P&L subtracts costs net of VAT (imponibile) from revenue net of VAT, and
-- costs incl. VAT from gross revenue. spese.importo stays the amount paid (VAT
-- included); spese.imponibile is the net amount, NULL when unknown, in which case
-- the full importo is used for both views.
--
-- The category -> accounting heading map grows to cover the categories imported from
-- Stiv. Each category belongs to exactly one heading, so per-heading totals match
-- Stiv's P&L lines B.6-B.14 (verified on 846 expenses, 67 months, 0 differences).

alter table public.spese add column if not exists imponibile numeric;
comment on column public.spese.imponibile is
  'Net amount (VAT excluded). NULL when unknown: the Bilancio then uses importo for both net and gross.';

create or replace function public.bilancio_voce_spesa(p_categoria text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case lower(trim(coalesce(p_categoria, '')))
    -- B.6 acquisti di beni
    when 'prodotti'                    then 'acquisto_prodotti'
    when 'acquisto prodotti'           then 'acquisto_prodotti'
    when 'accoglienza e allestimento'  then 'acquisto_prodotti'
    when 'pulizia'                     then 'acquisto_prodotti'
    when 'attrezzatura'                then 'acquisto_prodotti'
    -- B.7 servizi
    when 'utenze'                      then 'servizi_esterni'
    when 'manutenzione'                then 'servizi_esterni'
    when 'marketing'                   then 'servizi_esterni'
    when 'banca e pos'                 then 'servizi_esterni'
    when 'telefono e internet'         then 'servizi_esterni'
    when 'gestionale'                  then 'servizi_esterni'
    when 'formazione'                  then 'servizi_esterni'
    when 'consulenze'                  then 'servizi_esterni'
    when 'assicurazioni'               then 'servizi_esterni'
    when 'viaggi e trasferte'          then 'servizi_esterni'
    when 'servizi esterni'             then 'servizi_esterni'
    -- B.8 godimento beni di terzi
    when 'affitto'                     then 'affitti_noleggi'
    when 'leasing attrezzature'        then 'affitti_noleggi'
    when 'spese condominiali'          then 'affitti_noleggi'
    when 'noleggi'                     then 'affitti_noleggi'
    when 'affitti e noleggi'           then 'affitti_noleggi'
    -- B.9 personale
    when 'personale'                   then 'personale'
    -- B.10 ammortamenti
    when 'ammortamenti'                then 'ammortamenti'
    -- B.14 oneri diversi di gestione: tasse e diritti, altro, anything unknown
    else 'altre_spese'
  end
$$;

-- Bilancio: costs net (imponibile) against net revenue, gross against gross.
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

