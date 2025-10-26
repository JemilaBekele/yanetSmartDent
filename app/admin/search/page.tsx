"use client";

import UsersPage from '@/app/components/search/search'
import { Suspense } from 'react';

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <UsersPage />
      </Suspense>
    </div>
  );
}
