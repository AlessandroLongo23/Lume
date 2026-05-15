// Single source of truth for Lume's legal identity.
// Every legal page, DPA, invoice, breach notice, and email footer reads from here.
// Placeholders below are filled in once the Danish CVR is registered at Erhvervsstyrelsen.

export const LUME_LEGAL = {
  // Trading name. Same string everywhere ("Lume").
  name: 'Lume',

  // Legal name as registered (Enkeltmandsvirksomhed in Denmark).
  // Format: "Lume v/Alessandro Longo" once registered.
  legalName: 'Lume — Alessandro Longo',

  // 8-digit Danish CVR-nummer. Empty string until registration.
  cvr: '',

  // EU VAT in Danish format: "DK" + 8-digit CVR. Derived once cvr is filled.
  vatNumber: '',

  // Full registered address in Denmark.
  address: {
    street: '',
    postalCode: '',
    city: '',
    country: 'Denmark',
  },

  // Foro convenzionale for the ToS.
  foro: 'Copenhagen, Denmark',

  // GDPR lead supervisory authority based on main establishment.
  // Italian Garante still receives complaints from IT data subjects under one-stop-shop.
  leadSupervisoryAuthority: {
    name: 'Datatilsynet',
    fullName: 'Datatilsynet (Danish Data Protection Agency)',
    url: 'https://www.datatilsynet.dk',
  },

  // DPO not designated — Art. 37 GDPR thresholds not met at current scale.
  dpoDesignated: false,

  // Contact channels.
  privacyEmail: 'privacy@lumeapp.it',
  supportEmail: 'info@lumeapp.it',

  // Date of first commercial offering (used in footers / "established").
  established: '2026',
} as const;

export type LumeLegal = typeof LUME_LEGAL;

// Helper: human-readable single-line address.
export function formatLumeAddress(): string {
  const { street, postalCode, city, country } = LUME_LEGAL.address;
  const parts = [street, [postalCode, city].filter(Boolean).join(' '), country].filter(Boolean);
  return parts.join(', ');
}

// Helper: combined "name (CVR …)" string for invoices and legal headers.
export function formatLumeIdentity(): string {
  if (!LUME_LEGAL.cvr) return LUME_LEGAL.legalName;
  return `${LUME_LEGAL.legalName} — CVR ${LUME_LEGAL.cvr}`;
}
