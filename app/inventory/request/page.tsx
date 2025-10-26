'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { InventoryRequestDataTable } from '@/app/components/inventory/request/list';

export default function RequestPage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold"> Inventory Requests</h1>
          <Link href="/inventory/request/create">
            <Button>New Inventory Request</Button>
          </Link>
        </div>

        <InventoryRequestDataTable />
      </div>
    </div>
  );
}
