/**
 * Central registry of every entity that can be imported. Core pipeline files
 * (runProcess, runCommit, llmMapper) dispatch through this registry by reading
 * `import_jobs.entity` and looking up the matching config.
 */

import type { EntityImportConfig, ImportEntity } from './types';
import { clientsConfig } from './clients/config';
import { productCategoriesConfig } from './productCategories/config';
import { manufacturersConfig } from './manufacturers/config';
import { suppliersConfig } from './suppliers/config';
import { serviceCategoriesConfig } from './serviceCategories/config';
import { operatorsConfig } from './operators/config';
import { productsConfig } from './products/config';
import { servicesConfig } from './services/config';

// Per-entity configs are typed against their own TRow; the registry erases
// that to the default `Record<string, unknown>` so dispatch sites can resolve
// a config without knowing the row type at compile time. The cast is sound
// because the only places that reach into TRow (transformRow, buildInsertPayload)
// work on data they themselves produced.
const REGISTRY: Record<ImportEntity, EntityImportConfig | undefined> = {
  clients: clientsConfig as unknown as EntityImportConfig,
  productCategories: productCategoriesConfig as unknown as EntityImportConfig,
  manufacturers: manufacturersConfig as unknown as EntityImportConfig,
  suppliers: suppliersConfig as unknown as EntityImportConfig,
  serviceCategories: serviceCategoriesConfig as unknown as EntityImportConfig,
  operators: operatorsConfig as unknown as EntityImportConfig,
  products: productsConfig as unknown as EntityImportConfig,
  services: servicesConfig as unknown as EntityImportConfig,
};

/**
 * Resolves an entity name to its config. Throws if the entity isn't registered
 * yet — callers handle this by marking the job `failed`.
 */
export function getEntityConfig(entity: string): EntityImportConfig {
  const config = REGISTRY[entity as ImportEntity];
  if (!config) throw new Error(`Entity '${entity}' non supportata`);
  return config;
}

/** True when the entity is wired up and accepts new import jobs. */
export function isEntitySupported(entity: string): boolean {
  return Boolean(REGISTRY[entity as ImportEntity]);
}

/** All supported entities (skipping registry slots that are still placeholder). */
export function listSupportedEntities(): ImportEntity[] {
  return (Object.keys(REGISTRY) as ImportEntity[]).filter((k) => REGISTRY[k]);
}
