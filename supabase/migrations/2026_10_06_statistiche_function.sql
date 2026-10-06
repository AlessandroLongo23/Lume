-- Statistiche for any date range, computed on the server.
--
-- Replaces the client-side calculation in stores/statistiche.ts, which downloaded
-- every fiche of the period with all its services, products and payments (dozens
-- of paged requests, about 20 seconds for three and a half years of one salon)
-- and added them up in the browser.
--
-- Rules, the same the browser applied:
--
--   * Only fiches with status 'completed' count, on the day of fiches.datetime in
--     Europe/Rome. p_from and p_to are both included.
--   * A fiche is worth total_override when set, otherwise the sum of final_price
--     over its services and products. On fiche_products final_price is the line
--     total, never multiplied by quantity.
--   * Service and product rankings add up line prices, so a manual fiche total
--     does not change them.
--   * A client is "nuovo" when the salon has no fiche for them before p_from.
--   * A fiche belongs to the operator of its earliest service. (The browser took
--     the first row in id order, which was arbitrary.)
--
-- SECURITY INVOKER: callers only ever see rows RLS lets them see. p_salon_id
-- defaults to the caller's active salon.

create index if not exists idx_fiches_salon_datetime      on public.fiches (salon_id, datetime);
create index if not exists idx_fiche_services_fiche_id    on public.fiche_services (fiche_id);
create index if not exists idx_fiche_products_fiche_id    on public.fiche_products (fiche_id);
create index if not exists idx_fiche_payments_fiche_id    on public.fiche_payments (fiche_id);

create or replace function public.statistiche(
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
  v_start  timestamptz;
  v_end    timestamptz;
  v_result jsonb;
begin
  if v_salon is null or p_from is null or p_to is null or p_to < p_from then
    return null;
  end if;

  v_start := p_from::timestamp at time zone 'Europe/Rome';
  v_end   := (p_to + 1)::timestamp at time zone 'Europe/Rome';

  with
  fiche_base as materialized (
    select f.id, f.client_id, f.datetime, f.total_override
    from public.fiches f
    where f.salon_id = v_salon
      and f.status = 'completed'
      and f.datetime >= v_start
      and f.datetime <  v_end
  ),
  servizi_in as materialized (
    select fs.id, fs.fiche_id, fs.service_id, fs.operator_id, fs.name, fs.final_price, fs.start_time
    from public.fiche_services fs
    join fiche_base b on b.id = fs.fiche_id
  ),
  prodotti_in as materialized (
    select fp.fiche_id, fp.product_id, fp.quantity, fp.final_price
    from public.fiche_products fp
    join fiche_base b on b.id = fp.fiche_id
  ),
  tot_servizi as (select fiche_id, sum(final_price) as tot from servizi_in group by fiche_id),
  tot_prodotti as (select fiche_id, sum(final_price) as tot from prodotti_in group by fiche_id),
  fiche_in as materialized (
    select b.id, b.client_id, b.datetime,
           coalesce(b.total_override, coalesce(ts.tot, 0) + coalesce(tp.tot, 0))::numeric as totale
    from fiche_base b
    left join tot_servizi ts on ts.fiche_id = b.id
    left join tot_prodotti tp on tp.fiche_id = b.id
  ),

  -- clients
  clienti as (
    select fi.client_id, count(*) as presenze, sum(fi.totale) as incasso
    from fiche_in fi
    group by fi.client_id
  ),
  gia_clienti as (
    select distinct f.client_id
    from public.fiches f
    where f.salon_id = v_salon and f.datetime < v_start and f.client_id is not null
  ),

  -- services
  servizi as (
    select si.service_id,
           mode() within group (order by si.name) as nome,
           count(*) as numero,
           sum(si.final_price) as incasso
    from servizi_in si
    group by si.service_id
  ),
  servizi_categorie as (
    select s.category_id, sum(si.final_price) as incasso, count(*) as numero
    from servizi_in si
    join public.services s on s.id = si.service_id
    group by s.category_id
  ),
  servizi_operatori as (
    select si.operator_id, si.service_id,
           mode() within group (order by si.name) as servizio,
           count(*) as numero,
           sum(si.final_price) as incasso
    from servizi_in si
    group by si.operator_id, si.service_id
  ),

  -- products
  prodotti as (
    select pi.product_id, sum(pi.quantity) as quantita, sum(pi.final_price) as incasso
    from prodotti_in pi
    group by pi.product_id
  ),
  prodotti_categorie as (
    select p.product_category_id, sum(pi.final_price) as incasso, sum(pi.quantity) as quantita
    from prodotti_in pi
    join public.products p on p.id = pi.product_id
    group by p.product_category_id
  ),

  -- operators
  fiche_operatore as (
    select distinct on (si.fiche_id) si.fiche_id, si.operator_id
    from servizi_in si
    order by si.fiche_id, si.start_time, si.id
  ),
  operatori as (
    select fo.operator_id,
           count(*) as fiche,
           sum(fi.totale) as incasso,
           count(distinct fi.client_id) as clienti
    from fiche_operatore fo
    join fiche_in fi on fi.id = fo.fiche_id
    where fo.operator_id is not null
    group by fo.operator_id
  ),
  operatore_servizio as (
    select distinct on (c.operator_id) c.operator_id, c.name as servizio
    from (
      select si.operator_id, si.name, count(*) as numero
      from servizi_in si
      group by si.operator_id, si.name
    ) c
    order by c.operator_id, c.numero desc, c.name
  )

  select jsonb_build_object(
    'dal', p_from,
    'al',  p_to,

    'kpi', (select jsonb_build_object(
      'incasso',        coalesce(sum(totale), 0),
      'fiche',          count(*),
      'clienti_attivi', count(distinct client_id)
    ) from fiche_in),

    'pagamenti', (select jsonb_build_object(
      'contanti', coalesce(sum(fp.amount) filter (where fp.method = 'cash'), 0),
      'pos',      coalesce(sum(fp.amount) filter (where fp.method = 'pos'), 0),
      'altro',    coalesce(sum(fp.amount) filter (where fp.method not in ('cash', 'pos')), 0)
    ) from public.fiche_payments fp join fiche_base b on b.id = fp.fiche_id),

    -- Monday first: seven counts, zero where the salon had no fiche
    'giorni', (select jsonb_agg(coalesce(g.numero, 0) order by d.giorno)
      from generate_series(1, 7) as d(giorno)
      left join (
        select extract(isodow from fi.datetime at time zone 'Europe/Rome')::int as giorno, count(*) as numero
        from fiche_in fi group by 1
      ) g on g.giorno = d.giorno),

    'clienti', coalesce((select jsonb_agg(jsonb_build_object(
        'id',       c.client_id,
        'nome',     coalesce(cl."firstName" || ' ' || cl."lastName", 'Cliente eliminato'),
        'presenze', c.presenze,
        'incasso',  c.incasso
      ) order by c.incasso desc, c.client_id)
      from clienti c left join public.clients cl on cl.id = c.client_id), '[]'::jsonb),

    'nuovi_abituali', (select jsonb_build_object(
      'nuovi',    count(*) filter (where g.client_id is null),
      'abituali', count(*) filter (where g.client_id is not null)
    ) from clienti c left join gia_clienti g on g.client_id = c.client_id
      where c.client_id is not null),

    'servizi', coalesce((select jsonb_agg(jsonb_build_object(
        'id',        s.service_id,
        'nome',      s.nome,
        'categoria', coalesce(sc.name, '—'),
        'numero',    s.numero,
        'incasso',   s.incasso
      ) order by s.incasso desc, s.nome)
      from servizi s
      left join public.services sv on sv.id = s.service_id
      left join public.service_categories sc on sc.id = sv.category_id), '[]'::jsonb),

    'servizi_categorie', coalesce((select jsonb_agg(jsonb_build_object(
        'nome',    coalesce(sc.name, 'Senza categoria'),
        'incasso', c.incasso,
        'numero',  c.numero
      ) order by c.incasso desc)
      from servizi_categorie c left join public.service_categories sc on sc.id = c.category_id), '[]'::jsonb),

    'servizi_operatori', coalesce((select jsonb_agg(jsonb_build_object(
        'operatore', coalesce(o."firstName" || ' ' || o."lastName", 'Operatore eliminato'),
        'servizio',  so.servizio,
        'numero',    so.numero,
        'incasso',   so.incasso
      ) order by so.incasso desc, so.servizio)
      from servizi_operatori so left join public.operators o on o.id = so.operator_id), '[]'::jsonb),

    'prodotti', coalesce((select jsonb_agg(jsonb_build_object(
        'id',        p.product_id,
        'nome',      coalesce(pr.name, 'Prodotto eliminato'),
        'categoria', coalesce(pc.name, '—'),
        'quantita',  p.quantita,
        'incasso',   p.incasso
      ) order by p.incasso desc, pr.name)
      from prodotti p
      left join public.products pr on pr.id = p.product_id
      left join public.product_categories pc on pc.id = pr.product_category_id), '[]'::jsonb),

    'prodotti_categorie', coalesce((select jsonb_agg(jsonb_build_object(
        'nome',    coalesce(pc.name, 'Senza categoria'),
        'incasso', c.incasso,
        'numero',  c.quantita
      ) order by c.incasso desc)
      from prodotti_categorie c left join public.product_categories pc on pc.id = c.product_category_id), '[]'::jsonb),

    'operatori', coalesce((select jsonb_agg(jsonb_build_object(
        'id',           op.operator_id,
        'nome',         coalesce(o."firstName" || ' ' || o."lastName", 'Operatore eliminato'),
        'fiche',        op.fiche,
        'incasso',      op.incasso,
        'top_servizio', coalesce(os.servizio, '—'),
        'clienti',      op.clienti
      ) order by op.incasso desc, op.operator_id)
      from operatori op
      left join public.operators o on o.id = op.operator_id
      left join operatore_servizio os on os.operator_id = op.operator_id), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- Revenue per month for the chart "Andamento incassi": the last p_mesi calendar
-- months in Europe/Rome, the current one included, oldest first, zero when empty.
create or replace function public.statistiche_andamento(
  p_mesi     int  default 13,
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
  v_primo  date;
  v_result jsonb;
begin
  if v_salon is null or p_mesi is null or p_mesi < 1 or p_mesi > 120 then
    return null;
  end if;

  v_primo := (date_trunc('month', now() at time zone 'Europe/Rome') - make_interval(months => p_mesi - 1))::date;

  with
  fiche_base as materialized (
    select f.id, f.total_override,
           to_char(f.datetime at time zone 'Europe/Rome', 'YYYY-MM') as mese
    from public.fiches f
    where f.salon_id = v_salon
      and f.status = 'completed'
      and f.datetime >= (v_primo::timestamp at time zone 'Europe/Rome')
  ),
  tot_servizi as (
    select fs.fiche_id, sum(fs.final_price) as tot
    from public.fiche_services fs join fiche_base b on b.id = fs.fiche_id group by fs.fiche_id
  ),
  tot_prodotti as (
    select fp.fiche_id, sum(fp.final_price) as tot
    from public.fiche_products fp join fiche_base b on b.id = fp.fiche_id group by fp.fiche_id
  ),
  per_mese as (
    select b.mese, sum(coalesce(b.total_override, coalesce(ts.tot, 0) + coalesce(tp.tot, 0))) as incasso
    from fiche_base b
    left join tot_servizi ts on ts.fiche_id = b.id
    left join tot_prodotti tp on tp.fiche_id = b.id
    group by b.mese
  )
  select jsonb_agg(jsonb_build_object('mese', m.mese, 'incasso', coalesce(pm.incasso, 0)) order by m.mese)
  into v_result
  from (
    select to_char(v_primo + make_interval(months => i), 'YYYY-MM') as mese
    from generate_series(0, p_mesi - 1) as i
  ) m
  left join per_mese pm on pm.mese = m.mese;

  return v_result;
end;
$$;

revoke all on function public.statistiche(date, date, uuid) from public, anon;
revoke all on function public.statistiche_andamento(int, uuid) from public, anon;
grant execute on function public.statistiche(date, date, uuid) to authenticated, service_role;
grant execute on function public.statistiche_andamento(int, uuid) to authenticated, service_role;
