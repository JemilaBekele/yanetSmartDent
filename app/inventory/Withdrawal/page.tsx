'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WithdrawalRequestDataTable } from '@/app/components/inventory/WithdrawalRequests/list';

export default function WithdrawalItemsPage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Withdrawal Items</h1>
          <Link href="/inventory/Withdrawal/create">
            <Button>New Item Withdrawal</Button>
          </Link>
        </div>

        <WithdrawalRequestDataTable />
      </div>
    </div>
  );
}
