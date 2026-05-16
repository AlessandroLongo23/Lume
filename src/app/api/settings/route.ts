import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { getActiveSalonId } from '@/lib/utils/getActiveSalonId';
import { normalizeProfileRole, canManageSalon } from '@/lib/auth/roles';
import type { SalonFiscal, RegimeFiscale, BusinessType, SalonFormDefaults, SalonEmailNotifications, BookingConfig, BookingAccessMode, BookingApprovalScope } from '@/lib/types/Salon';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthContext() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('salon_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  const effectiveRole = normalizeProfileRole(profile);
  const salonId = await getActiveSalonId(profile.salon_id, effectiveRole === 'admin');
  return { user, profile: { ...profile, role: effectiveRole ?? profile.role }, salonId, admin };
}

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { data: salon } = await ctx.admin
    .from('salons')
    .select('name, type, operating_hours, track_inventory, address, city, cap, province, phone, public_email, logo_url, favicon_url, brand_color, fiscal, slot_granularity_min, default_appointment_duration_min, default_low_stock_threshold, form_defaults, email_notifications, allow_operator_self_unavailability, color_by_client, slug, booking_enabled, booking_setup_dismissed_at, booking_config')
    .eq('id', ctx.salonId)
    .single();

  if (!salon) return NextResponse.json({ error: 'Salone non trovato' }, { status: 404 });

  return NextResponse.json({
    name: salon.name,
    type: salon.type,
    operating_hours: salon.operating_hours,
    track_inventory: salon.track_inventory ?? false,
    address: salon.address ?? null,
    city: salon.city ?? null,
    cap: salon.cap ?? null,
    province: salon.province ?? null,
    phone: salon.phone ?? null,
    public_email: salon.public_email ?? null,
    logo_url: salon.logo_url ?? null,
    favicon_url: salon.favicon_url ?? null,
    brand_color: salon.brand_color ?? null,
    fiscal: (salon.fiscal ?? {}) as SalonFiscal,
    slot_granularity_min: salon.slot_granularity_min ?? 15,
    default_appointment_duration_min: salon.default_appointment_duration_min ?? 30,
    default_low_stock_threshold: salon.default_low_stock_threshold ?? 0,
    form_defaults: (salon.form_defaults ?? {}) as SalonFormDefaults,
    email_notifications: (salon.email_notifications ?? {}) as SalonEmailNotifications,
    allow_operator_self_unavailability: salon.allow_operator_self_unavailability ?? false,
    color_by_client: salon.color_by_client ?? true,
    slug: salon.slug ?? null,
    booking_enabled: salon.booking_enabled ?? false,
    booking_setup_dismissed_at: salon.booking_setup_dismissed_at ?? null,
    booking_config: (salon.booking_config ?? {}) as BookingConfig,
  });
}

const BUSINESS_TYPES: readonly BusinessType[] = ['barber', 'hair_salon', 'beauty_center', 'nails', 'other'];
const REGIMI: readonly RegimeFiscale[] = ['forfettario', 'ordinario'];
const ALLOWED_IVA = new Set([0, 4, 5, 10, 22]);
const ALLOWED_SLOT_MIN = new Set([5, 10, 15, 30]);
const ALLOWED_DISCOUNT_TYPES = new Set(['fixed', 'percent', 'free_item']);
const ALLOWED_PAYMENT_METHODS = new Set(['cash', 'card', 'transfer']);
const ALLOWED_GENDERS = new Set(['M', 'F']);
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const CAP_RE = /^\d{5}$/;
// Mirrors the partial unique index in 2026_05_16_01_salons_booking_columns.sql.
// 1–63 chars, lowercase + digits + hyphen, cannot start/end with hyphen.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
// Every path here is either (a) an existing top-level route in src/app/ or
// (b) a name we want to keep available for future product/marketing pages.
// Add to this list whenever a new static top-level route is introduced —
// otherwise an owner can claim a slug that the router will route elsewhere
// (route-group static paths win over the public [slug] catch-all).
const RESERVED_SLUGS = new Set([
  // Infra & framework
  'api', '_next', 'public',
  // Marketing / brand
  'app', 'www', 'lume', 'support', 'about', 'pricing',
  // Existing top-level static routes
  'admin', 'auth', 'platform', 'account', 'dashboard', 'client-dashboard',
  'unauthorized', 'welcome',
  // Auth flow (under (auth) route group)
  'login', 'logout', 'signup', 'register', 'select-salon', 'select-workspace',
  // Onboarding flow
  'onboarding',
  // Legal (under (legal) route group)
  'privacy', 'terms', 'cookie-policy', 'dpa', 'sub-processors',
]);
const ACCESS_MODES: readonly BookingAccessMode[] = ['public', 'clients_only', 'selected'];
const APPROVAL_SCOPES: readonly BookingApprovalScope[] = ['chosen_operator', 'any_staff'];
// Italian VAT: 11 digits. CF (persona fisica): 16 alphanumeric; CF for entities = P.IVA. Keep checks soft.
const PIVA_RE = /^\d{11}$/;
const CF_RE = /^([A-Z0-9]{11}|[A-Z0-9]{16})$/i;
// SDI codice destinatario: 7 chars (alfanumerico)
const SDI_RE = /^[A-Z0-9]{7}$/i;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function nullableTrimmed(v: unknown, max = 200): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t) return null;
  if (t.length > max) return undefined;
  return t;
}

function parseFiscal(v: unknown): SalonFiscal | null {
  if (!isPlainObject(v)) return null;
  const out: SalonFiscal = {};

  if (v.ragione_sociale !== undefined) {
    const r = nullableTrimmed(v.ragione_sociale, 120);
    if (r === undefined) return null;
    if (r) out.ragione_sociale = r;
  }
  if (v.p_iva !== undefined) {
    const r = nullableTrimmed(v.p_iva, 16);
    if (r === undefined) return null;
    if (r && !PIVA_RE.test(r)) return null;
    if (r) out.p_iva = r;
  }
  if (v.codice_fiscale !== undefined) {
    const r = nullableTrimmed(v.codice_fiscale, 16);
    if (r === undefined) return null;
    if (r && !CF_RE.test(r)) return null;
    if (r) out.codice_fiscale = r.toUpperCase();
  }
  if (v.regime !== undefined) {
    if (typeof v.regime === 'string' && (REGIMI as readonly string[]).includes(v.regime)) {
      out.regime = v.regime as RegimeFiscale;
    } else if (v.regime !== null && v.regime !== '') {
      return null;
    }
  }
  if (v.sdi !== undefined) {
    const r = nullableTrimmed(v.sdi, 7);
    if (r === undefined) return null;
    if (r && !SDI_RE.test(r)) return null;
    if (r) out.sdi = r.toUpperCase();
  }
  if (v.pec !== undefined) {
    const r = nullableTrimmed(v.pec, 200);
    if (r === undefined) return null;
    if (r) out.pec = r;
  }
  if (v.default_iva_pct !== undefined) {
    if (v.default_iva_pct === null || v.default_iva_pct === '') {
      // omit
    } else {
      const n = typeof v.default_iva_pct === 'number' ? v.default_iva_pct : Number(v.default_iva_pct);
      if (!Number.isFinite(n) || !ALLOWED_IVA.has(n)) return null;
      out.default_iva_pct = n;
    }
  }
  return out;
}

function parseFormDefaults(v: unknown): SalonFormDefaults | null {
  if (!isPlainObject(v)) return null;
  const out: SalonFormDefaults = {};

  const intInRange = (raw: unknown, min: number, max: number): number | null => {
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return null;
    return n;
  };

  if (v.service_duration_min !== undefined) {
    const n = intInRange(v.service_duration_min, 5, 480);
    if (n === null) return null;
    out.service_duration_min = n;
  }
  if (v.gift_card_validity_months !== undefined) {
    const n = intInRange(v.gift_card_validity_months, 1, 120);
    if (n === null) return null;
    out.gift_card_validity_months = n;
  }
  if (v.gift_coupon_validity_months !== undefined) {
    const n = intInRange(v.gift_coupon_validity_months, 1, 120);
    if (n === null) return null;
    out.gift_coupon_validity_months = n;
  }
  if (v.gift_coupon_discount_type !== undefined) {
    if (typeof v.gift_coupon_discount_type !== 'string' || !ALLOWED_DISCOUNT_TYPES.has(v.gift_coupon_discount_type)) {
      return null;
    }
    out.gift_coupon_discount_type = v.gift_coupon_discount_type as SalonFormDefaults['gift_coupon_discount_type'];
  }
  if (v.abbonamento_treatments !== undefined) {
    const n = intInRange(v.abbonamento_treatments, 1, 999);
    if (n === null) return null;
    out.abbonamento_treatments = n;
  }
  if (v.abbonamento_discount_percent !== undefined) {
    const n = Number(v.abbonamento_discount_percent);
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    out.abbonamento_discount_percent = n;
  }
  if (v.abbonamento_payment_method !== undefined) {
    if (typeof v.abbonamento_payment_method !== 'string' || !ALLOWED_PAYMENT_METHODS.has(v.abbonamento_payment_method)) {
      return null;
    }
    out.abbonamento_payment_method = v.abbonamento_payment_method as SalonFormDefaults['abbonamento_payment_method'];
  }
  if (v.client_phone_prefix !== undefined) {
    if (typeof v.client_phone_prefix !== 'string') return null;
    const t = v.client_phone_prefix.trim();
    if (t && !/^\+\d{1,4}$/.test(t)) return null;
    if (t) out.client_phone_prefix = t;
  }
  if (v.client_default_gender !== undefined) {
    if (typeof v.client_default_gender !== 'string' || !ALLOWED_GENDERS.has(v.client_default_gender)) {
      return null;
    }
    out.client_default_gender = v.client_default_gender as SalonFormDefaults['client_default_gender'];
  }

  return out;
}

function parseBookingConfig(v: unknown): BookingConfig | null {
  if (!isPlainObject(v)) return null;
  const out: BookingConfig = {};

  const intInRange = (raw: unknown, min: number, max: number): number | null => {
    const n = Number(raw);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < min || n > max) return null;
    return n;
  };

  if (v.access_mode !== undefined) {
    if (typeof v.access_mode !== 'string' || !(ACCESS_MODES as readonly string[]).includes(v.access_mode)) return null;
    out.access_mode = v.access_mode as BookingAccessMode;
  }
  if (v.allow_operator_choice !== undefined) out.allow_operator_choice = Boolean(v.allow_operator_choice);
  if (v.require_approval !== undefined) out.require_approval = Boolean(v.require_approval);
  if (v.approval_scope !== undefined) {
    if (typeof v.approval_scope !== 'string' || !(APPROVAL_SCOPES as readonly string[]).includes(v.approval_scope)) return null;
    out.approval_scope = v.approval_scope as BookingApprovalScope;
  }
  if (v.min_lead_minutes !== undefined) {
    const n = intInRange(v.min_lead_minutes, 0, 43200);
    if (n === null) return null;
    out.min_lead_minutes = n;
  }
  if (v.max_lead_days !== undefined) {
    const n = intInRange(v.max_lead_days, 1, 365);
    if (n === null) return null;
    out.max_lead_days = n;
  }
  if (v.cancel_window_hours !== undefined) {
    const n = intInRange(v.cancel_window_hours, 0, 720);
    if (n === null) return null;
    out.cancel_window_hours = n;
  }
  if (v.buffer_between_minutes !== undefined) {
    const n = intInRange(v.buffer_between_minutes, 0, 240);
    if (n === null) return null;
    out.buffer_between_minutes = n;
  }
  if (v.guest_email_required !== undefined) out.guest_email_required = Boolean(v.guest_email_required);
  if (v.public_message !== undefined) {
    if (v.public_message === null) {
      out.public_message = null;
    } else if (typeof v.public_message === 'string') {
      const t = v.public_message.trim();
      if (t.length > 500) return null;
      out.public_message = t || null;
    } else {
      return null;
    }
  }
  return out;
}

function parseEmailNotifications(v: unknown): SalonEmailNotifications | null {
  if (!isPlainObject(v)) return null;
  const out: SalonEmailNotifications = {};

  if (v.sender_name !== undefined) {
    if (typeof v.sender_name !== 'string') return null;
    const t = v.sender_name.trim();
    if (t.length > 80) return null;
    if (t) out.sender_name = t;
  }
  if (v.reply_to !== undefined) {
    if (typeof v.reply_to !== 'string') return null;
    const t = v.reply_to.trim();
    if (t.length > 200) return null;
    if (t && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
    if (t) out.reply_to = t;
  }
  if (v.appointment_reminder !== undefined) {
    if (!isPlainObject(v.appointment_reminder)) return null;
    const enabled = Boolean(v.appointment_reminder.enabled);
    const hours = Number(v.appointment_reminder.hours_before);
    if (!Number.isFinite(hours) || !Number.isInteger(hours) || hours < 1 || hours > 168) return null;
    out.appointment_reminder = { enabled, hours_before: hours };
  }
  if (v.birthday_wishes !== undefined) {
    if (!isPlainObject(v.birthday_wishes)) return null;
    out.birthday_wishes = { enabled: Boolean(v.birthday_wishes.enabled) };
  }
  if (v.fiche_by_email !== undefined) {
    if (!isPlainObject(v.fiche_by_email)) return null;
    out.fiche_by_email = { enabled: Boolean(v.fiche_by_email.enabled) };
  }

  return out;
}

export async function PATCH(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  if (!canManageSalon(ctx.profile.role as 'admin' | 'owner' | 'operator')) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!isPlainObject(body)) {
    return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string') return NextResponse.json({ error: 'Dati non validi' }, { status: 400 });
    const trimmed = body.name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      return NextResponse.json({ error: 'Il nome del salone deve contenere tra 1 e 80 caratteri' }, { status: 400 });
    }
    updates.name = trimmed;
  }

  if (body.type !== undefined) {
    if (typeof body.type !== 'string' || !(BUSINESS_TYPES as readonly string[]).includes(body.type)) {
      return NextResponse.json({ error: 'Tipo attività non valido' }, { status: 400 });
    }
    updates.type = body.type;
  }

  if (body.operating_hours !== undefined) {
    if (!Array.isArray(body.operating_hours) || body.operating_hours.length !== 7) {
      return NextResponse.json({ error: 'Orari di apertura non validi' }, { status: 400 });
    }
    updates.operating_hours = body.operating_hours;
  }

  if (body.track_inventory !== undefined) {
    updates.track_inventory = Boolean(body.track_inventory);
  }

  for (const key of ['address', 'city', 'province', 'phone', 'public_email'] as const) {
    if (body[key] !== undefined) {
      const r = nullableTrimmed(body[key], 200);
      if (r === undefined) return NextResponse.json({ error: `Campo non valido: ${key}` }, { status: 400 });
      updates[key] = r;
    }
  }

  if (body.cap !== undefined) {
    const r = nullableTrimmed(body.cap, 5);
    if (r === undefined) return NextResponse.json({ error: 'CAP non valido' }, { status: 400 });
    if (r && !CAP_RE.test(r)) return NextResponse.json({ error: 'CAP non valido' }, { status: 400 });
    updates.cap = r;
  }

  if (body.brand_color !== undefined) {
    const r = nullableTrimmed(body.brand_color, 9);
    if (r === undefined) return NextResponse.json({ error: 'Colore non valido' }, { status: 400 });
    if (r && !HEX_COLOR.test(r)) return NextResponse.json({ error: 'Colore non valido' }, { status: 400 });
    updates.brand_color = r;
  }

  // logo_url and favicon_url are written by the /api/settings/branding route only
  // (they hold storage paths). Reject direct writes here.
  if ('logo_url' in body || 'favicon_url' in body) {
    return NextResponse.json({ error: 'Carica logo/favicon dalla sezione Branding' }, { status: 400 });
  }

  if (body.fiscal !== undefined) {
    const fiscal = parseFiscal(body.fiscal);
    if (fiscal === null) return NextResponse.json({ error: 'Dati fiscali non validi' }, { status: 400 });
    updates.fiscal = fiscal;
  }

  if (body.slot_granularity_min !== undefined) {
    const n = Number(body.slot_granularity_min);
    if (!Number.isFinite(n) || !ALLOWED_SLOT_MIN.has(n)) {
      return NextResponse.json({ error: 'Granularità slot non valida' }, { status: 400 });
    }
    updates.slot_granularity_min = n;
  }

  if (body.default_appointment_duration_min !== undefined) {
    const n = Number(body.default_appointment_duration_min);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 5 || n > 480) {
      return NextResponse.json({ error: 'Durata appuntamento non valida' }, { status: 400 });
    }
    updates.default_appointment_duration_min = n;
  }

  if (body.default_low_stock_threshold !== undefined) {
    const n = Number(body.default_low_stock_threshold);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 9999) {
      return NextResponse.json({ error: 'Soglia magazzino non valida' }, { status: 400 });
    }
    updates.default_low_stock_threshold = n;
  }

  if (body.form_defaults !== undefined) {
    const fd = parseFormDefaults(body.form_defaults);
    if (fd === null) return NextResponse.json({ error: 'Default form non validi' }, { status: 400 });
    updates.form_defaults = fd;
  }

  if (body.email_notifications !== undefined) {
    const en = parseEmailNotifications(body.email_notifications);
    if (en === null) return NextResponse.json({ error: 'Notifiche email non valide' }, { status: 400 });
    updates.email_notifications = en;
  }

  if (body.allow_operator_self_unavailability !== undefined) {
    updates.allow_operator_self_unavailability = Boolean(body.allow_operator_self_unavailability);
  }

  if (body.color_by_client !== undefined) {
    updates.color_by_client = Boolean(body.color_by_client);
  }

  if (body.slug !== undefined) {
    if (body.slug === null) {
      updates.slug = null;
    } else {
      if (typeof body.slug !== 'string') return NextResponse.json({ error: 'Slug non valido' }, { status: 400 });
      const t = body.slug.trim().toLowerCase();
      if (t === '') {
        updates.slug = null;
      } else {
        if (!SLUG_RE.test(t)) {
          return NextResponse.json({ error: 'Lo slug può contenere solo lettere minuscole, numeri e trattini (non agli estremi).' }, { status: 400 });
        }
        if (RESERVED_SLUGS.has(t)) {
          return NextResponse.json({ error: 'Questo slug è riservato. Scegline un altro.' }, { status: 400 });
        }
        updates.slug = t;
      }
    }
  }

  if (body.booking_enabled !== undefined) {
    updates.booking_enabled = Boolean(body.booking_enabled);
  }

  // Onboarding "skip booking setup" sends this as the current timestamp.
  // Accept null to unset, ISO string to set, anything else rejected.
  if (body.booking_setup_dismissed_at !== undefined) {
    if (body.booking_setup_dismissed_at === null) {
      updates.booking_setup_dismissed_at = null;
    } else if (typeof body.booking_setup_dismissed_at === 'string') {
      const parsed = new Date(body.booking_setup_dismissed_at);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Data dismissal non valida' }, { status: 400 });
      }
      updates.booking_setup_dismissed_at = parsed.toISOString();
    } else {
      return NextResponse.json({ error: 'Data dismissal non valida' }, { status: 400 });
    }
  }

  if (body.booking_config !== undefined) {
    const bc = parseBookingConfig(body.booking_config);
    if (bc === null) return NextResponse.json({ error: 'Configurazione prenotazioni non valida' }, { status: 400 });
    // Merge with existing config so partial PATCHes don't wipe other keys.
    const { data: existing } = await ctx.admin
      .from('salons')
      .select('booking_config')
      .eq('id', ctx.salonId)
      .single();
    const merged = { ...(existing?.booking_config ?? {}), ...bc };
    updates.booking_config = merged;
  }

  // Forbid enabling booking without a slug — the public URL relies on it.
  if (updates.booking_enabled === true) {
    const { data: existing } = await ctx.admin
      .from('salons')
      .select('slug')
      .eq('id', ctx.salonId)
      .single();
    const effectiveSlug = ('slug' in updates ? updates.slug : existing?.slug) as string | null | undefined;
    if (!effectiveSlug) {
      return NextResponse.json({ error: 'Imposta uno slug prima di attivare le prenotazioni online.' }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nessun dato da aggiornare' }, { status: 400 });
  }

  const { error } = await ctx.admin
    .from('salons')
    .update(updates)
    .eq('id', ctx.salonId);

  if (error) {
    // Postgres unique-violation on the partial slug index.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Questo slug è già in uso. Scegline un altro.' }, { status: 409 });
    }
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Errore durante il salvataggio' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
