

"use client";



import CompanyProfilePage from '@/app/components/campanyProfile/all';
import { Suspense } from 'react';

// Import Spinner component

export default function Dis() {
  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <CompanyProfilePage />
      </Suspense>
    
      
    </div>
  );
}