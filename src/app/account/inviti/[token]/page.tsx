import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { LumeLogo } from '@/lib/components/shared/ui/LumeLogo';
import { ClaimInviteClient } from './ClaimInviteClient';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ClaimInvitePage({ params }: Props) {
  const { token } = await params;

  const supabaseAdmin = getAdminClient();

  const { data: invite } = await supabaseAdmin
    .from('pending_membership_invites')
    .select('id, email, salon_id, expires_at, claimed_at, declined_at')
    .eq('token', token)
    .maybeSingle<{
      id: string;
      email: string;
      salon_id: string;
      expires_at: string;
      claimed_at: string | null;
      declined_at: string | null;
    }>();

  let salonName = 'il salone';
  if (invite) {
    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('name')
      .eq('id', invite.salon_id)
      .single<{ name: string }>();
    salonName = salon?.name ?? 'il salone';
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  type InviteState =
    | 'invalid'
    | 'expired'
    | 'already_claimed'
    | 'declined'
    | 'wrong_user'
    | 'ready';
  let state: InviteState;

  if (!invite) {
    state = 'invalid';
  } else if (invite.claimed_at) {
    state = 'already_claimed';
  } else if (invite.declined_at || new Date(invite.expires_at) < new Date()) {
    state = 'expired';
  } else if (user && user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    state = 'wrong_user';
  } else {
    state = 'ready';
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <LumeLogo size="lg" />
      </div>
      <ClaimInviteClient
        token={token}
        salonName={salonName}
        email={invite?.email ?? ''}
        state={state}
        isLoggedIn={!!user}
        currentUserEmail={user?.email ?? null}
      />
    </div>
  );
}
