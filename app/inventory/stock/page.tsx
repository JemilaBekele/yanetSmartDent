'use client'


import { StockTable } from '@/app/components/inventory/stock/stocklist';

export default function PurchasePage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
       

        <StockTable />
      </div>
    </div>
  );
}
