
"use client";


import NotePage from '@/app/components/Note/all';

import { Suspense } from 'react';

// Import Spinner component

type MedicalCertificateFormProps= { 
  params: {
    id: string;
  };
};
export default function NoteMedcer({ params }: MedicalCertificateFormProps){ 
  

  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense>
       
       <NotePage params={params} />
       </Suspense>
  
      
    </div>
  );
}
