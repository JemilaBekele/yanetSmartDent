import CreateInventoryRequestPage from '@/app/components/inventory/request/create';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Inventory Request',
  description: 'Page to create a new inventory request',
};

export default function NewInventoryRequestPage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <CreateInventoryRequestPage />
      </div>
    </div>
  );
}
