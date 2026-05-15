// Public list of sub-processors that handle Lume customers' personal data.
// Single source of truth shared between the public /sub-processors page,
// the Privacy Policy and the DPA.
//
// Update protocol: when adding/removing/replacing a sub-processor, bump
// `lastUpdated`, then send the 30-day notice email to all active subscribers
// via /api/admin/notify-subprocessor-change. The DPA gives them 15 days to
// object in writing.

export interface SubProcessor {
  name: string;
  purpose: string;
  country: string;
  countryCode: string;
  transferMechanism: string;
  url: string;
  privacyUrl: string;
}

export const SUB_PROCESSORS: SubProcessor[] = [
  {
    name: 'Supabase Inc.',
    purpose: 'Database (PostgreSQL), autenticazione, archiviazione file',
    country: 'Stati Uniti',
    countryCode: 'US',
    transferMechanism: 'Clausole Contrattuali Standard 2021/914 + cifratura at-rest/in-transit',
    url: 'https://supabase.com',
    privacyUrl: 'https://supabase.com/privacy',
  },
  {
    name: 'Vercel Inc.',
    purpose: "Hosting dell'applicazione e CDN",
    country: 'Stati Uniti',
    countryCode: 'US',
    transferMechanism: 'Clausole Contrattuali Standard 2021/914',
    url: 'https://vercel.com',
    privacyUrl: 'https://vercel.com/legal/privacy-policy',
  },
  {
    name: 'Stripe Payments Europe Ltd.',
    purpose: 'Elaborazione dei pagamenti e gestione abbonamenti',
    country: 'Irlanda',
    countryCode: 'IE',
    transferMechanism: 'Trattamento intra-UE (titolare autonomo per i dati di pagamento)',
    url: 'https://stripe.com',
    privacyUrl: 'https://stripe.com/privacy',
  },
  {
    name: 'Resend Inc.',
    purpose: 'Invio di email transazionali (notifiche, recupero password, comunicazioni di servizio)',
    country: 'Stati Uniti',
    countryCode: 'US',
    transferMechanism: 'Clausole Contrattuali Standard 2021/914',
    url: 'https://resend.com',
    privacyUrl: 'https://resend.com/legal/privacy-policy',
  },
];

export const SUB_PROCESSORS_LAST_UPDATED = '2026-05-15';
