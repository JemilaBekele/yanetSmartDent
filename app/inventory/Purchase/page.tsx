'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PurchaseDataTable } from '@/app/components/inventory/Purchase/list';

export default function PurchasePage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Purchases</h1>
          <Link href="/inventory/Purchase/create">
            <Button>New Purchase</Button>
          </Link>
        </div>

        <PurchaseDataTable />
      </div>
    </div>
  );
}
