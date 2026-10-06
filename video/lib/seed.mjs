// Rows some tours need to find in the demo salon before they start. Everything
// created here is newer than the recorder's snapshot, so `restore` removes it.

async function one(query, what) {
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(`seed: ${what}: ${error.message}`);
  if (!data) throw new Error(`seed: ${what} not found in the demo salon`);
  return data;
}

/**
 * An open fiche (an appointment, not yet paid) with one service.
 * @param {{ db: import('@supabase/supabase-js').SupabaseClient, salonId: string, now: Date }} ctx
 *   `now` is the time the recording pretends it is (see `stageTime`)
 * @param {{ client: [string, string], service: string, inMinutes?: number }} what
 */
export async function seedOpenFiche({ db, salonId, now }, { client: [firstName, lastName], service, inMinutes = 30 }) {
  const at = new Date(now.getTime() + inMinutes * 60000);
  const client = await one(
    db.from('clients').select('id').eq('salon_id', salonId).eq('firstName', firstName).eq('lastName', lastName),
    `client ${firstName} ${lastName}`,
  );
  const svc = await one(
    db.from('services').select('id, name, duration, price').eq('salon_id', salonId).eq('name', service),
    `service ${service}`,
  );
  const operator = await one(
    db.from('operators').select('id').eq('salon_id', salonId).is('archived_at', null).order('created_at'),
    'an operator',
  );
  const { data: fiche, error } = await db
    .from('fiches')
    .insert({ salon_id: salonId, client_id: client.id, datetime: at.toISOString(), status: 'created', paid: false })
    .select('id')
    .single();
  if (error) throw new Error(`seed: fiche: ${error.message}`);
  const end = new Date(at.getTime() + svc.duration * 60000);
  const { error: lineError } = await db.from('fiche_services').insert({
    salon_id: salonId, fiche_id: fiche.id, service_id: svc.id, operator_id: operator.id,
    start_time: at.toISOString(), end_time: end.toISOString(), duration: svc.duration,
    list_price: svc.price, final_price: svc.price, name: svc.name,
  });
  if (lineError) throw new Error(`seed: fiche service: ${lineError.message}`);
  return fiche.id;
}
