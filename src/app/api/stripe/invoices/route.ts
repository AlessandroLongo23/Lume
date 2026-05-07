import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { canManageSalon } from '@/lib/auth/roles';
import type { Invoice, InvoiceStatus } from '@/lib/types/Subscription';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Resolves an invoice to its underlying charge ID. Tries the deprecated
// invoice.charge field first (still populated in API responses for back-compat
// in Basil), falling back to the new invoice.payments[].payment.payment_intent
// → latest_charge path. Returns null if the invoice has no associated charge
// (e.g. unpaid, void, or out-of-band payments).
async function resolveChargeId(invoice: Stripe.Invoice): Promise<string | null> {
  const inv = invoice as Stripe.Invoice & {
    charge?: string | { id?: string } | null;
    payments?: { data?: Array<{
      payment?: {
        type?: 'charge' | 'payment_intent' | 'out_of_band_payment';
        charge?: string | null;
        payment_intent?: string | null;
      };
    }> };
  };

  if (typeof inv.charge === 'string') return inv.charge;
  if (inv.charge && typeof inv.charge === 'object' && inv.charge.id) return inv.charge.id;

  const payment = inv.payments?.data?.[0]?.payment;
  if (!payment) return null;

  if (payment.type === 'charge' && payment.charge) return payment.charge;

  if (payment.type === 'payment_intent' && payment.payment_intent) {
    try {
      const pi = await getStripe().paymentIntents.retrieve(payment.payment_intent);
      const latest = pi.latest_charge;
      if (typeof latest === 'string') return latest;
      if (latest && typeof latest === 'object' && latest.id) return latest.id;
    } catch (e) {
      console.error(`Failed to retrieve payment intent ${payment.payment_intent}:`, e);
    }
  }
  return null;
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('salon_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || !canManageSalon(profile.role)) {
      return NextResponse.json({ error: 'Solo il proprietario può visualizzare le fatture.' }, { status: 403 });
    }

    const { data: salon } = await supabaseAdmin
      .from('salons')
      .select('stripe_customer_id')
      .eq('id', profile.salon_id)
      .single();

    if (!salon?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    const list = await getStripe().invoices.list({
      customer: salon.stripe_customer_id,
      limit: 12,
    });

    // Stripe leaves invoice.status = 'paid' after a refund (refunds live on
    // the underlying charge). Resolve each invoice to its charge and read
    // amount_refunded. Charge IDs come from the deprecated-but-still-present
    // invoice.charge field, falling back to the Basil-native invoice.payments
    // path when charge is null.
    const refundedByInvoice = new Map<string, number>();
    await Promise.all(list.data.map(async (inv) => {
      const invId = inv.id;
      if (!invId) return;
      const chargeId = await resolveChargeId(inv);
      if (!chargeId) return;
      try {
        const charge = await getStripe().charges.retrieve(chargeId);
        if (charge.amount_refunded > 0) {
          refundedByInvoice.set(invId, charge.amount_refunded);
        }
      } catch (e) {
        console.error(`Failed to fetch charge ${chargeId} for invoice ${invId}:`, e);
      }
    }));

    const invoices: Invoice[] = list.data.map((inv) => ({
      id:               inv.id ?? '',
      number:           inv.number ?? null,
      createdAt:        new Date(inv.created * 1000).toISOString(),
      amount:           (inv.amount_paid || inv.amount_due) / 100,
      currency:         (inv.currency ?? 'eur').toUpperCase(),
      status:           (inv.status ?? 'open') as InvoiceStatus,
      refundedAmount:   (refundedByInvoice.get(inv.id ?? '') ?? 0) / 100,
      hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      invoicePdfUrl:    inv.invoice_pdf ?? null,
    }));

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Invoices error:', error);
    return NextResponse.json({ error: 'Errore durante il caricamento delle fatture.' }, { status: 500 });
  }
}
