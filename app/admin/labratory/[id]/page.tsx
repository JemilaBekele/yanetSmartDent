
"use client";

import DentalLabFormPage from '@/app/components/medicaldata/labratory/add';

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
       
       <DentalLabFormPage params={params} />
       </Suspense>
  
      
    </div>
  );
}
