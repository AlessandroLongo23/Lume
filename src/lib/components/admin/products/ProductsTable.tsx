'use client';

import { useState } from 'react';
import { useProductsStore } from '@/lib/stores/products';
import { Product } from '@/lib/types/Product';
import { Table } from '@/lib/components/admin/table/Table';
import { EditProductModal } from './EditProductModal';
import { DeleteProductModal } from './DeleteProductModal';

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const isLoading = useProductsStore((s) => s.isLoading);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editedProduct, setEditedProduct] = useState<Partial<Product>>({});

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setEditedProduct(new Product(product));
    setShowEdit(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setSelectedProduct(product);
    setShowDelete(true);
  };

  return (
    <>
      <Table
        columns={Product.dataColumns}
        data={products}
        handleEditClick={handleEditClick}
        handleDeleteClick={handleDeleteClick}
        detailPageUrl="prodotti"
        isLoading={isLoading}
        labelPlural="prodotti"
        labelSingular="prodotto"
      />
      <EditProductModal isOpen={showEdit} onClose={() => setShowEdit(false)} editedProduct={editedProduct} onEditedProductChange={setEditedProduct} selectedProduct={selectedProduct} />
      <DeleteProductModal isOpen={showDelete} onClose={() => setShowDelete(false)} selectedProduct={selectedProduct} />
    </>
  );
}
