'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Supplier, SupplierDataTable } from '@/app/components/inventory/supplier/list';
import { SupplierModal } from '@/app/components/inventory/supplier/create';

export default function SupplierPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Supplier
        </Button>
      </div>

      <SupplierDataTable
        onEdit={handleEdit}
        refreshTrigger={refreshTrigger}
      />

      <SupplierModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialData={editingSupplier}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
