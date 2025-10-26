"use client";


import FilterCredits from '@/app/components/cretitpatient/report/report'
import { Suspense } from 'react';
 // Import Spinner component

export default function CreditHome() {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense fallback={<div>Loading...</div>}>
       <FilterCredits/>
       </Suspense>
     
      
    </div>
  );
}