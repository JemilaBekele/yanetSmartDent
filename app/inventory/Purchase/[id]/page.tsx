import UpdatePurchasePage from '@/app/components/inventory/Purchase/update';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Update Purchase',
  description: 'Page to update an existing purchase',
};

export default function PurchaseUpdateWrapper({ params }: { params: { id: string } }) {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <UpdatePurchasePage params={params} />
      </div>
    </div>
  );
}
