

import UpdateStockLocationWithdrawalPage from '@/app/components/inventory/stockwithdrawal/LoctoLoc/update';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Update Stock Location Withdrawal',
  description: 'Page to update an existing stock location withdrawal',
};

export default function StockLocationWithdrawalUpdateWrapper({ params }: { params: { id: string } }) {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <UpdateStockLocationWithdrawalPage params={params} />
      </div>
    </div>
  );
}
