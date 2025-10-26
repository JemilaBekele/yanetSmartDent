
"use client";

import MedicalCertificateForm from '@/app/components/medicaldata/medicalcertificate/add';

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
       
       <MedicalCertificateForm params={params} />
       </Suspense>
  
      
    </div>
  );
}
