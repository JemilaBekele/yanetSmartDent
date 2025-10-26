"use client";


import CreaditAll from '@/app/components/medicaldata/Creadit/all/allincreadit'
import { Suspense } from 'react';
 // Import Spinner component

type CreaditFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: CreaditFormProps) {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       <CreaditAll params={params} />
       </Suspense>
     
      
    </div>
  );
}