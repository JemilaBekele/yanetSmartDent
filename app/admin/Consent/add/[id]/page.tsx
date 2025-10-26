"use client";



import ConsontFindingForm from '@/app/components/medicaldata/Consent/add';
import { Suspense } from 'react';
 // Import Spinner component

type CreaditFormProps = {
  params: {
    id: string;
  };
};
export default function Constadd({ params }: CreaditFormProps) {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       <ConsontFindingForm params={params} />
       </Suspense>
     
      
    </div>
  );
}