"use client";


import UnconfirmedCredits from '@/app/components/cretitpatient/cretitpat';
import { Suspense } from 'react';

export default function Orga() {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense >
      <UnconfirmedCredits />
      </Suspense>
    
      
    </div>
  );
}

