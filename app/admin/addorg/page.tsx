

"use client";



import OrganizationManagement from '@/app/components/organazation/add/adminadd';
import { Suspense } from 'react';

// Import Spinner component

export default function Dis() {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <OrganizationManagement />
      </Suspense>
    
      
    </div>
  );
}