'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PurchaseDataTable } from '@/app/components/inventory/Purchase/list';
import { StockLedgerTable } from '@/app/components/inventory/stock/leager';

export default function PurchasePage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        

        <StockLedgerTable />
      </div>
    </div>
  );
}
