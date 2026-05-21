import { supabase } from '@/lib/supabase/client';
import { Fiche } from '@/lib/types/Fiche';
import { FicheService } from '@/lib/types/FicheService';
import { FicheProduct } from '@/lib/types/FicheProduct';
import { useFichesStore } from '@/lib/stores/fiches';
import { useFicheServicesStore } from '@/lib/stores/fiche_services';
import { useFicheProductsStore } from '@/lib/stores/fiche_products';

/**
 * Ensure a single fiche (and its line items) is loaded, regardless of the
 * 90-day window the stores' bulk fetches use. Returns the cached fiche when it
 * is already present; otherwise fetches it plus its services/products and
 * hydrates all three stores so `FicheModal` can render the fiche. Returns null
 * when no such fiche exists (or RLS hides it).
 *
 * Lives in its own leaf module — importing the per-entity stores directly into
 * `fiches.ts` would create a circular type dependency (fiche_services already
 * imports fiches), which collapses `useFichesStore`'s inferred type to `any`.
 */
export async function loadFicheById(id: string): Promise<Fiche | null> {
  const cached = useFichesStore.getState().fiches.find((f) => f.id === id);
  if (cached) return cached;

  const { data, error } = await supabase.from('fiches').select('*').eq('id', id).single();
  if (error || !data) return null;
  const fiche = new Fiche(data as ConstructorParameters<typeof Fiche>[0]);

  const [{ data: servicesData }, { data: productsData }] = await Promise.all([
    supabase.from('fiche_services').select('*').eq('fiche_id', id),
    supabase.from('fiche_products').select('*').eq('fiche_id', id),
  ]);

  useFichesStore.setState((s) =>
    s.fiches.some((f) => f.id === id) ? s : { fiches: [...s.fiches, fiche] },
  );

  if (servicesData?.length) {
    useFicheServicesStore.setState((s) => {
      const have = new Set(s.fiche_services.map((fs) => fs.id));
      const incoming = servicesData
        .filter((fs) => !have.has(fs.id))
        .map((fs) => new FicheService(fs));
      return incoming.length ? { fiche_services: [...s.fiche_services, ...incoming] } : s;
    });
  }
  if (productsData?.length) {
    useFicheProductsStore.setState((s) => {
      const have = new Set(s.fiche_products.map((fp) => fp.id));
      const incoming = productsData
        .filter((fp) => !have.has(fp.id))
        .map((fp) => new FicheProduct(fp));
      return incoming.length ? { fiche_products: [...s.fiche_products, ...incoming] } : s;
    });
  }

  return fiche;
}
