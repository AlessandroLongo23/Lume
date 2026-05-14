/**
 * Creates a demo user attached to the shared "Test Salone Demo" tenant.
 *
 *   npx tsx scripts/demo/create-demo-user.ts <email> "<First Last>" [password]
 *
 * Example:
 *   npx tsx scripts/demo/create-demo-user.ts demo+mario@lume.app "Mario Rossi"
 *
 * Required env (loaded from .env.local then .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The email MUST match `demo+*@lume.app` — that's the pattern the PostHog
 * provider uses to auto-accept analytics consent so session replay starts
 * immediately. Using any other email shape will silently disable replay
 * for that prospect (the cookie banner will appear instead).
 */
import { randomBytes } from 'node:crypto';
import { config as dotenvConfig } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenvConfig({ path: '.env.local' });
dotenvConfig();

const DEMO_SALON_ID = '984686e9-9765-40d2-aeb9-c62fbbd64e17';
const DEMO_EMAIL_REGEX = /^demo\+.+@lume\.app$/i;

function exit(msg: string, code = 1): never {
  console.error(msg);
  process.exit(code);
}

function generatePassword(): string {
  // 12 url-safe chars, plenty of entropy and easy to dictate over the phone.
  return randomBytes(9).toString('base64url');
}

async function main() {
  const [, , email, displayName, passwordArg] = process.argv;

  if (!email || !displayName) {
    exit('Usage: tsx scripts/demo/create-demo-user.ts <email> "<First Last>" [password]');
  }
  if (!DEMO_EMAIL_REGEX.test(email)) {
    exit(
      `Email "${email}" doesn't match the demo pattern (demo+*@lume.app).\n` +
      `Demo emails outside this pattern won't get auto-accepted analytics consent.`,
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    exit('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const trimmedName = displayName.trim().split(/\s+/);
  const firstName = trimmedName[0] ?? 'Demo';
  const lastName = trimmedName.slice(1).join(' ') || 'Prospect';
  const password = passwordArg ?? generatePassword();

  const admin = createClient(url, serviceKey);

  // 1. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { firstName, lastName, is_demo: true },
  });
  if (authError || !authData.user) {
    exit(`Auth user creation failed: ${authError?.message ?? 'unknown error'}`);
  }
  const userId = authData.user.id;

  // 2. Profile (legacy salon_id column still populated alongside membership)
  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    salon_id: DEMO_SALON_ID,
    first_name: firstName,
    last_name: lastName,
    email,
    role: 'owner',
  });
  if (profileError) exit(`Profile insert failed: ${profileError.message}`);

  // 3. Membership — canonical multi-salon link, marked primary for this user
  const { error: membershipError } = await admin.from('user_salon_memberships').insert({
    user_id: userId,
    salon_id: DEMO_SALON_ID,
    role: 'owner',
    is_primary: true,
  });
  if (membershipError) exit(`Membership insert failed: ${membershipError.message}`);

  // 4. Active salon — short-circuits the get_user_salon_id() COALESCE chain
  const { error: activeError } = await admin
    .from('user_active_salon')
    .upsert({ user_id: userId, salon_id: DEMO_SALON_ID }, { onConflict: 'user_id' });
  if (activeError) exit(`user_active_salon upsert failed: ${activeError.message}`);

  // No operator row: demo users log in as shadow owners but must NOT clutter
  // the calendar's bookable-resource list (which prospects use to assess the
  // tool). The 4 real operators in the demo salon stay clean.

  console.log('');
  console.log('Demo user created');
  console.log('---------------------------------------------');
  console.log(`Login URL : https://lume-gestionale.vercel.app/login`);
  console.log(`Email     : ${email}`);
  console.log(`Password  : ${password}`);
  console.log(`Salon     : Test Salone Demo (${DEMO_SALON_ID})`);
  console.log(`User ID   : ${userId}`);
  console.log('');
}

main().catch((e) => exit(e instanceof Error ? e.message : String(e)));
