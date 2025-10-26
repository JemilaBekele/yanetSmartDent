"use client";


import CreaditForm from '@/app/components/medicaldata/Creadit/add/creaditadd'
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
       <CreaditForm params={params} />
       </Suspense>
     
      
    </div>
  );
}