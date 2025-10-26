"use client";

import PrescriptionForm from '@/app/components/medicaldata/perscription/add/persadd';
import { Suspense } from 'react';

// Import Spinner component

type PrescriptionFormProps= { 
  params: {
    id: string;
  };
};
export default function Per({ params }: PrescriptionFormProps){ 
  

  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense fallback={<div>Loading...</div>}>
       
       <PrescriptionForm params={params} />
       </Suspense>
  
      
    </div>
  );
}
