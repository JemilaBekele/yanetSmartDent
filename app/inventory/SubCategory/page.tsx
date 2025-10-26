// app/categories/page.tsx

import SubCategoryPage from "@/app/components/inventory/SubCategory/list";


// ✅ Meta header
export const metadata = {
  title: 'Categories | My App',
  description: 'Manage all product categories in your system',
  keywords: 'categories, products, management',
};

export default function Categories() {
  return (
    <div className="container mx-auto p-6">

      <SubCategoryPage />
    </div>
  );
}
