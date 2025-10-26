// app/categories/page.tsx

import UnitOfMeasurePage from "@/app/components/inventory/unitmeasure/list";


// ✅ Meta header
export const metadata = {
  title: '  Unit measure ',
 
};

export default function Categories() {
  return (
    <div className="container mx-auto p-6">
      <UnitOfMeasurePage />
    </div>
  );
}
