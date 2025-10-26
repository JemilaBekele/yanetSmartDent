

'use client'


import { PersonalStockDataTable } from '@/app/components/inventory/stockholder/list';

export default function RequestPage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold"> Perdonal Stock Holder</h1>
          {/* <Link href="/inventory/request/create">
            <Button>New Inventory Request</Button>
          </Link> */}
        </div>

        <PersonalStockDataTable />
      </div>
    </div>
  );
}
