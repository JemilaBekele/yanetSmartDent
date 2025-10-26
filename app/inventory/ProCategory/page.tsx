// app/categories/page.tsx

import ProductCategoryPage from "@/app/components/inventory/ProCategory/list";


// ✅ Meta header
export const metadata = {
  title: 'Categories | My App',
  description: 'Manage all product categories in your system',
  keywords: 'categories, products, management',
};

export default function Categories() {
  return (
    <div className="container mx-auto p-6">
      <ProductCategoryPage />
    </div>
  );
}
