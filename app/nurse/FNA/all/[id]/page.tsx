
"use client";


import FNAPage from '@/app/components/medicaldata/FNA/all';

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
       
       <FNAPage params={params} />
       </Suspense>
  
      
    </div>
  );
}
