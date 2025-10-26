
"use client";

import FNAForm from '@/app/components/medicaldata/FNA/add';

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
       
       <FNAForm params={params} />
       </Suspense>
  
      
    </div>
  );
}
