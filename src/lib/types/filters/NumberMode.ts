export enum NumberMode {
  EXACT = 'exact',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  BETWEEN = 'between',
}

export type NumberFilterValue =
  | { mode: NumberMode.EXACT; value: number | null }
  | { mode: NumberMode.LESS_THAN; value: number | null }
  | { mode: NumberMode.LESS_THAN_OR_EQUAL; value: number | null }
  | { mode: NumberMode.GREATER_THAN; value: number | null }
  | { mode: NumberMode.GREATER_THAN_OR_EQUAL; value: number | null }
  | { mode: NumberMode.BETWEEN; min: number | null; max: number | null };
