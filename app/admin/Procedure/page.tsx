

"use client";



import ProcedurePage from '@/app/components/campanyProfile/Procedure/all';
import { Suspense } from 'react';

// Import Spinner component

export default function Dis() {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <ProcedurePage />
      </Suspense>
    
      
    </div>
  );
}