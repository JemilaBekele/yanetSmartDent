



"use client";

import DentalLabDisplay from '@/app/components/medicaldata/labratory/all';

import { Suspense } from 'react';

// Import Spinner component

type MedicalCertificateFormProps= { 
  params: {
    id: string;
  };
};
export default function Medcer({ params }: MedicalCertificateFormProps){ 
  

  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense>
       
       <DentalLabDisplay params={params} />
       </Suspense>
  
      
    </div>
  );
}
