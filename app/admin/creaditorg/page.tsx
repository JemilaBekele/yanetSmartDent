

"use client";



import CreServicesPage from '@/app/components/creditorg/all';
import { Suspense } from 'react';

// Import Spinner component

export default function Dis() {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <CreServicesPage />
      </Suspense>
    
      
    </div>
  );
}