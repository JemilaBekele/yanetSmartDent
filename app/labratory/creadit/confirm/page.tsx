"use client";



import ConfirmrCredits from '@/app/components/cretitpatient/confir/confi';
import { Suspense } from 'react';
 // Import Spinner component

export default function CreditHome() {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
<ConfirmrCredits/>
       </Suspense>
     
      
    </div>
  );
}