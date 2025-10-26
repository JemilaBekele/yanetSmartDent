
"use client";


import ReferralPage from '@/app/components/medicaldata/Referal/all';

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
       
       <ReferralPage params={params} />
       </Suspense>
  
      
    </div>
  );
}
