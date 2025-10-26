

// app/categories/page.tsx

import ProductBatchesPage from "@/app/components/inventory/ProductBatch/manycreate";


// ✅ Meta header
export const metadata = {
  title: 'Product Batches',
};

export default function Protegories() {
  return (
    <div className="container mx-auto p-6">
      <ProductBatchesPage/>
    </div>
  );
}
