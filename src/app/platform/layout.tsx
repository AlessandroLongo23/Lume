import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/gateway/admins';
import { PlatformShell } from '@/lib/components/platform/PlatformShell';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user.id))) notFound();

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .maybeSingle<{ first_name: string | null; last_name: string | null; email: string | null }>();

  return (
    <PlatformShell
      firstName={profile?.first_name ?? ''}
      lastName={profile?.last_name ?? ''}
      email={profile?.email ?? user.email ?? ''}
    >
      {children}
    </PlatformShell>
  );
}
