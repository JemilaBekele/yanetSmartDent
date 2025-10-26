"use client";



import CreditForm from '@/app/components/medicaldata/Creadit/recep';
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
       <CreditForm params={params} />
       </Suspense>
     
      
    </div>
  );
}