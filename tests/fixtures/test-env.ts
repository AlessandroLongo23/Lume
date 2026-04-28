import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.test' });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} in .env.test. Copy .env.test.example to .env.test and fill staging values.`,
    );
  }
  return value;
}

export const testEnv = {
  baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
  supabaseUrl: required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  testSalonId: required('E2E_TEST_SALON_ID'),
  roles: {
    admin:    { email: required('E2E_ADMIN_EMAIL'),    password: required('E2E_ADMIN_PASSWORD') },
    owner:    { email: required('E2E_OWNER_EMAIL'),    password: required('E2E_OWNER_PASSWORD') },
    operator: { email: required('E2E_OPERATOR_EMAIL'), password: required('E2E_OPERATOR_PASSWORD') },
    client:   { email: required('E2E_CLIENT_EMAIL'),   password: required('E2E_CLIENT_PASSWORD') },
  },
} as const;

export type TestRole = keyof typeof testEnv.roles;
