// app/locations/page.tsx

import LocationPage from "@/app/components/inventory/Locations/list";


// ✅ Meta header
export const metadata = {
  title: 'Locations | My App',
  description: 'Manage all inventory locations in your system',
  keywords: 'locations, inventory, management',
};

export default function Locations() {
  return (
    <div className="container mx-auto p-6">
      <LocationPage />
    </div>
  );
}
