
"use client";

import NoteForm from '@/app/components/Note/add';

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
       
       <NoteForm params={params} />
       </Suspense>
  
      
    </div>
  );
}
