"use client";

import FetchExpence from '@/app/components/expense/all/allexpense'
import { Suspense } from 'react';

export default function Expenseall() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <FetchExpence />
      </Suspense>
    </div>
  );
}
