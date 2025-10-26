"use client";



import PrescriptionPage from '@/app/components/medicaldata/perscription/all/persall';
import { Suspense } from 'react';


type PrescriptionFormProps= { 
  params: {
    id: string;
  };
};
export default function Per({ params }: PrescriptionFormProps){ 
 

  // Once loading is complete, render the actual content
  return (

    <div >
             <Suspense fallback={<div>Loading...</div>}>
      
             <PrescriptionPage params={params} />
             
             </Suspense>
      
      
    </div>
  );
}
