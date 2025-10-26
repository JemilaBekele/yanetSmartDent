"use client";

import AdminExpenseReport from '@/app/components/expense/admin';
import { Suspense } from 'react';

export default function Expenseall() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <AdminExpenseReport />
      </Suspense>
    </div>
  );
}
