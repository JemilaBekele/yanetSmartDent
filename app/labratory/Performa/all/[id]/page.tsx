
"use client";


import PerformaPage from '@/app/components/medicaldata/Performas/all';

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
       
       <PerformaPage params={params} />
       </Suspense>
  
      
    </div>
  );
}
