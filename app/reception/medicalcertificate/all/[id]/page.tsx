
"use client";


import CertificatePage from '@/app/components/medicaldata/medicalcertificate/all';

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
       
       <CertificatePage params={params} />
       </Suspense>
  
      
    </div>
  );
}
