

"use client";

import FinishedDentalForms from '@/app/components/patient/labfinish';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <FinishedDentalForms />
      </Suspense>
    </div>
  );
}
