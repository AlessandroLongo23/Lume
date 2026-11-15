import { FicheBucket } from '@/lib/types/Fiche';
import type { StatusTone } from '@/lib/components/shared/ui/StatusDot';

/**
 * Fiche state as a dot colour beside the bucket word (see StatusDot).
 * Replaces the tinted pills of BUCKET_STYLES in src/lib/types/Fiche.ts.
 */
export const FICHE_BUCKET_TONE: Record<FicheBucket, StatusTone> = {
  [FicheBucket.PRENOTATA]: 'info',
  [FicheBucket.ARRETRATA]: 'warning',
  [FicheBucket.CONCLUSA]: 'success',
};
