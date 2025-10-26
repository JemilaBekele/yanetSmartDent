"use client";

import ExpenseForm from '@/app/components/expense/add/expense'
import { Suspense } from 'react';

export default function Expense() {
  return (
    <div>
      <Suspense >
        <ExpenseForm />
      </Suspense>
    </div>
  );
}
