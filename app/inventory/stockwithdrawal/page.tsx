'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StockRequestDataTable } from '@/app/components/inventory/stockwithdrawal/list';

export default function StockWithdrawalPage() {
  return (
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Stock Withdrawals</h1>
          <Link href="/inventory/stockwithdrawal/create">
            <Button>New Stock Withdrawal</Button>
          </Link>
        </div>

        <StockRequestDataTable />
      </div>
    </div>
  );
}
