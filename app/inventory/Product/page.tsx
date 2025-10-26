'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Product, ProductDataTable, ProductFormValues } from '@/app/components/inventory/Product/list';
import { ProductModal } from '@/app/components/inventory/Product/create';


export default function ProductPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormValues | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

const handleEdit = (product: Product) => {
  const formValues: ProductFormValues = {
    id: product._id,
    productCode: product.productCode,
    name: product.name,
    description: product.description,
    categoryId: typeof product.categoryId === "string" 
      ? product.categoryId 
      : product.categoryId?._id ?? "",
    subCategoryId: typeof product.subCategoryId === "string" 
      ? product.subCategoryId 
      : product.subCategoryId?._id ?? "",
  };

  setEditingProduct(formValues);
  setIsModalOpen(true);
};

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold"></h1>
                <h1 className="text-3xl font-bold">Products</h1>

        <Button onClick={() => setIsModalOpen(true)}>
          Add Product
        </Button>
      </div>

      <ProductDataTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
      />

      <ProductModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingProduct}
        onSuccess={handleSuccess}
      />
    </div>
  );
}