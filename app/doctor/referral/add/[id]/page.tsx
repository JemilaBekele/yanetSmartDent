
"use client";

import ReferralCertificateForm from '@/app/components/medicaldata/Referal/add';

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
       
       <ReferralCertificateForm params={params} />
       </Suspense>
  
      
    </div>
  );
}
