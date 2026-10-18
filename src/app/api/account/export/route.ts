import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getCallerProfile } from '@/lib/gateway/getCallerProfile';
import { canManageSalon } from '@/lib/auth/roles';
import { exportSalonData } from '@/lib/server/exportSalonData';
import { createAdminClient } from '@/lib/supabase/admin';

// GDPR Art. 20 — Right to data portability.
// Returns the full salon dataset as a single structured JSON file (WP242
// recommends JSON / XML / CSV; JSON is canonical here). Owner / admin only.

export async function GET() {
  const supabase = await createServerClient();
  const caller = await getCallerProfile(supabase);
  if (!caller) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }
  if (!canManageSalon(caller.role)) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const admin = createAdminClient();
  const dump = await exportSalonData(caller.salon_id, admin);

  // Log the request for SLA tracking. Best-effort — never blocks the export.
  await admin
    .from('data_subject_requests')
    .insert({
      salon_id:        caller.salon_id,
      user_id:         caller.id,
      request_type:    'export',
      requested_at:    new Date().toISOString(),
      fulfilled_at:    new Date().toISOString(),
      fulfillment_notes: `${Object.keys(dump.tables).length} tabelle, ${dump.errors.length} errori`,
    })
    .then(({ error }) => {
      if (error) console.error('data_subject_requests log failed (non-fatal):', error.message);
    });

  const filename = `lume-export-${caller.salon_id.slice(0, 8)}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(dump, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
