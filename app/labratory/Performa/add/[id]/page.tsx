
"use client";

import PerInvoiceForm from '@/app/components/medicaldata/Performas/add';

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
       
       <PerInvoiceForm params={params} />
       </Suspense>
  
      
    </div>
  );
}
