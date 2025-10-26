

// app/categories/page.tsx

import ProductUnitPage from "@/app/components/inventory/productunit/list";


// ✅ Meta header
export const metadata = {
  title: 'ProductUnit',
 
};

export default function Categories() {
  return (
    <div className="container mx-auto p-6">
      <ProductUnitPage />
    </div>
  );
}
