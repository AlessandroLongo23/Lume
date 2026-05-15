// Pin every legal document to a version. Bump on any substantial change.
// On bump: email all active subscribers + re-prompt acceptance on next login.
// Stored alongside each row in the `legal_acceptances` table so we can prove
// what version a given user agreed to.

export const LEGAL_VERSIONS = {
  terms: '2026-05-15',
  privacy: '2026-05-15',
  dpa: '2026-05-15',
  cookiePolicy: '2026-05-15',
} as const;

export type LegalDocumentKey = keyof typeof LEGAL_VERSIONS;
