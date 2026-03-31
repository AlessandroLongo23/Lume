import type { LucideIcon } from 'lucide-react';
import type { Filter } from './filters/Filter';

export type FilterChoice = {
  value: string | number;
  label: string;
};

// DataColumn is intentionally generic — rows can be any domain object
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

export interface DataColumn {
  label: string;
  key: string;
  sortable: boolean;
  icon: LucideIcon;
  filter?: Filter;
  width?: string;
  sort?: (a: Row, b: Row, direction: 'asc' | 'desc') => number;
  getFilterChoice?: (row: Row) => FilterChoice;
  display?: (data: Row) => string;
  onclick?: (data: Row) => void;
  component?: {
    is: React.ComponentType<Row>;
    getProps: (data: Row) => Row;
  };
}
