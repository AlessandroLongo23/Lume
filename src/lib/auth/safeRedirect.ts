import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspace } from '@/lib/gateway/resolveWorkspace';
import type { GatewayResult } from '@/lib/types/Workspace';

export type SafeRedirect = {
  href: string;
  label: string;
};

const LABELS: Record<GatewayResult['redirect'], string> = {
  '/platform':         'la dashboard admin',
  '/admin/calendario': 'il tuo calendario',
  '/select-salon':     'la selezione salone',
  '/client-dashboard': 'la tua area cliente',
  '/select-workspace': 'la selezione workspace',
};

/**
 * Role-aware safe destination for an authenticated (or anonymous) request.
 * Reuses resolveWorkspace so admin / impersonation / owner / operator / client
 * routing rules stay in one place.
 */
export async function resolveSafeRedirect(): Promise<SafeRedirect> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { href: '/', label: 'la homepage' };
  }

  const result = await resolveWorkspace(user.id);
  return { href: result.redirect, label: LABELS[result.redirect] };
}
