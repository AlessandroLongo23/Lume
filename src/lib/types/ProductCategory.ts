import { FileText, Tag } from 'lucide-react';
import type { DataColumn } from './dataColumn';

export class ProductCategory {
  id: string;
  salon_id: string;
  name: string;
  description: string;

  constructor(productCategory: ProductCategory) {
    this.id = productCategory.id;
    this.salon_id = productCategory.salon_id;
    this.name = productCategory.name;
    this.description = productCategory.description;
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
