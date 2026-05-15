import { FileText, Tag } from 'lucide-react';
import { DEFAULT_CATEGORY_COLOR } from '@/lib/const/category-colors';
import type { DataColumn } from './dataColumn';

export type RawProductCategory = {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  color: string;
  archived_at?: string | null;
};

export class ProductCategory {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  color: string;
  archived_at: string | null;

  constructor(productCategory: RawProductCategory) {
    this.id = productCategory.id;
    this.salon_id = productCategory.salon_id;
    this.name = productCategory.name;
    this.description = productCategory.description;
    this.color = productCategory.color ?? DEFAULT_CATEGORY_COLOR;
    this.archived_at = productCategory.archived_at ?? null;
  }

  get isArchived(): boolean {
    return this.archived_at !== null;
  }

  static dataColumns: DataColumn[] = [
    {
      label: 'Nome',
      key: 'name',
      sortable: true,
      icon: Tag,
      display: (productCategory: ProductCategory) => productCategory.name,
    },
    {
      label: 'Descrizione',
      key: 'description',
      sortable: true,
      icon: FileText,
      display: (productCategory: ProductCategory) => productCategory.description ?? 'N/A',
    },
  ];
}
