import { parseNumber, parseInteger, parseBool } from '../../core/transforms';
import { buildDestFromMappings } from '../../core/transformRowHelpers';
import type { ColumnMapping, EntityImportConfig, RowResult } from '../types';

type DestField =
  | 'name'
  | 'productCategoryName'
  | 'manufacturerName'
  | 'supplierName'
  | 'price'
  | 'sellPrice'
  | 'isForRetail'
  | 'stockQuantity'
  | 'minThreshold'
  | 'quantityMl'
  | 'description';

interface ProductRow extends Record<string, unknown> {
  name: string;
  productCategoryName: string | null;
  manufacturerName: string | null;
  supplierName: string | null;
  // FK ids — populated by the FK resolver in runCommit before insert
  product_category_id: string | null;
  manufacturer_id: string | null;
  supplier_id: string | null;
  price: number;
  sellPrice: number | null;
  isForRetail: boolean;
  stockQuantity: number;
  minThreshold: number;
  quantityMl: number | null;
  description: string | null;
}

const DEST_FIELDS = [
  'name',
  'productCategoryName',
  'manufacturerName',
  'supplierName',
  'price',
  'sellPrice',
  'isForRetail',
  'stockQuantity',
  'minThreshold',
  'quantityMl',
  'description',
] as const satisfies readonly DestField[];

const DICTIONARY = {
  name:                 ['nome', 'prodotto', 'name', 'product', 'descrizione prodotto'],
  productCategoryName:  ['categoria', 'category', 'tipologia', 'tipo prodotto'],
  manufacturerName:     ['produttore', 'marchio', 'brand', 'manufacturer', 'casa'],
  supplierName:         ['fornitore', 'supplier', 'distributore'],
  price:                ['prezzo', 'price', 'costo', 'prezzo acquisto', 'prezzo costo'],
  sellPrice:            ['prezzo vendita', 'sell price', 'prezzo retail', 'prezzo pubblico'],
  isForRetail:          ['vendita', 'retail', 'in vendita', 'rivendita', 'a scaffale'],
  stockQuantity:        ['quantità', 'quantita', 'qty', 'stock', 'giacenza', 'pezzi'],
  minThreshold:         ['soglia minima', 'soglia', 'min threshold', 'min', 'scorta minima'],
  quantityMl:           ['ml', 'volume', 'quantità ml', 'capacità'],
  description:          ['descrizione', 'description', 'note', 'commento'],
};

function coerceNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  return parseNumber(String(v));
}
function coerceInteger(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (v == null) return null;
  return parseInteger(String(v));
}
function coerceBool(v: unknown): boolean | null {
  if (typeof v === 'boolean') return v;
  if (v == null) return null;
  return parseBool(String(v));
}
function coerceString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function transformRow(
  source: Record<string, string>,
  mappings: ColumnMapping[],
  rowIndex: number,
): RowResult<ProductRow> {
  const dest = buildDestFromMappings(source, mappings, DEST_FIELDS);

  const name = coerceString(dest.name) ?? '';
  const reasons: string[] = [];
  if (!name) reasons.push('nome mancante');

  const price = coerceNumber(dest.price) ?? 0;
  const sellPrice = coerceNumber(dest.sellPrice);
  const stockQuantity = coerceInteger(dest.stockQuantity) ?? 0;
  const minThreshold = coerceInteger(dest.minThreshold) ?? 0;
  const quantityMl = coerceInteger(dest.quantityMl);
  const isForRetail = coerceBool(dest.isForRetail) ?? false;

  if (dest.price != null && coerceNumber(dest.price) == null) reasons.push('prezzo non valido');
  if (dest.sellPrice != null && sellPrice == null && typeof dest.sellPrice !== 'number') {
    reasons.push('prezzo vendita non valido');
  }

  const candidate: ProductRow = {
    name,
    productCategoryName: coerceString(dest.productCategoryName),
    manufacturerName: coerceString(dest.manufacturerName),
    supplierName: coerceString(dest.supplierName),
    product_category_id: null,
    manufacturer_id: null,
    supplier_id: null,
    price,
    sellPrice,
    isForRetail,
    stockQuantity,
    minThreshold,
    quantityMl,
    description: coerceString(dest.description),
  };

  if (reasons.length > 0) {
    return { ok: false, rowIndex, reason: reasons.join(', '), rawValues: source, partialRow: candidate };
  }
  return { ok: true, row: candidate };
}

export const productsConfig: EntityImportConfig<ProductRow> = {
  entity: 'products',
  table: 'products',
  italianLabel: 'Prodotti',
  destFields: Object.keys(DICTIONARY),
  destFieldLabels: {
    name: 'Nome',
    productCategoryName: 'Categoria',
    manufacturerName: 'Produttore / Marchio',
    supplierName: 'Fornitore',
    price: 'Prezzo (costo)',
    sellPrice: 'Prezzo vendita',
    isForRetail: 'In vendita al pubblico',
    stockQuantity: 'Quantità in magazzino',
    minThreshold: 'Soglia minima',
    quantityMl: 'Volume (ml)',
    description: 'Descrizione',
  },
  hasRequiredCoverage: (mappings) => {
    const mapped = new Set(mappings.filter((m) => m.confidence >= 0.6).map((m) => m.destField));
    return mapped.has('name');
  },
  insufficientMappingReason: 'Impossibile identificare la colonna del nome prodotto.',
  dictionary: DICTIONARY,
  llmFieldDescriptions: {
    name: 'product name',
    productCategoryName: 'product category by name (e.g. shampoo, color, styling)',
    manufacturerName: 'brand / manufacturer by name (e.g. Wella, L\'Oréal)',
    supplierName: 'supplier / distributor by name',
    price: 'cost price (what the salon pays)',
    sellPrice: 'retail price (what the customer pays); leave blank if not for retail',
    isForRetail: 'true/false — is this product sold to customers',
    stockQuantity: 'units currently in stock (integer)',
    minThreshold: 'low-stock alert threshold (integer)',
    quantityMl: 'volume per unit in milliliters (e.g. 250 for a 250ml shampoo)',
    description: 'optional free-text description',
  },
  llmDomainHint: 'salon products / inventory items (cosmetics, tools)',
  smartModeEnabled: true,
  smartHints: {
    description: 'Italian salon software exports often combine multiple fields in a single column.',
    examples: [
      {
        sourceColumnHint: 'Prezzo vendita',
        explanation:
          "Numeric → sellPrice + isForRetail=true. 'Non in vendita' / 'Solo interno' → sellPrice=null + isForRetail=false.",
      },
      {
        sourceColumnHint: 'Stock / Min',
        explanation:
          "Pattern like '12 / 5' → split via regex into stockQuantity and minThreshold.",
      },
    ],
  },
  fkColumns: [
    { sourceField: 'productCategoryName', targetField: 'product_category_id', table: 'product_categories', matchField: 'name', autoCreate: true },
    { sourceField: 'manufacturerName',    targetField: 'manufacturer_id',     table: 'manufacturers',     matchField: 'name', autoCreate: true },
    { sourceField: 'supplierName',        targetField: 'supplier_id',         table: 'suppliers',         matchField: 'name', autoCreate: true },
  ],
  transformRow,
  // Dedup by name within the same product category, post-FK-resolution.
  // Two products with the same name but different categories are NOT duplicates.
  dedupKeys: [
    { rowField: 'name', column: 'name', normalize: 'lower-trim' },
  ],
  buildInsertPayload: (row, { salonId }) => ({
    salon_id: salonId,
    name: row.name,
    product_category_id: row.product_category_id,
    manufacturer_id: row.manufacturer_id,
    supplier_id: row.supplier_id,
    price: row.price,
    sell_price: row.sellPrice,
    is_for_retail: row.isForRetail,
    stock_quantity: row.stockQuantity,
    min_threshold: row.minThreshold,
    quantity_ml: row.quantityMl,
    description: row.description,
  }),
  previewColumns: [
    { key: 'name', label: 'Nome' },
    { key: 'productCategoryName', label: 'Categoria' },
    { key: 'manufacturerName', label: 'Marchio' },
    { key: 'supplierName', label: 'Fornitore' },
    { key: 'price', label: 'Prezzo' },
    { key: 'stockQuantity', label: 'Stock' },
  ],
  redirectAfterCompletion: '/admin/magazzino?tab=prodotti',
};
