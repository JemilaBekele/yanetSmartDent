

"use client";

import PatientOrthodontics from '@/app/components/medicaldata/Orthodontics/all';

import { Suspense } from 'react';
 // Import Spinner component

type CreaditFormProps = {
  params: {
    id: string;
  };
};
export default function Ortho({ params }: CreaditFormProps) {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       <PatientOrthodontics params={params} />
       </Suspense>
     
      
    </div>
  );
}