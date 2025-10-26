"use client";



import ConsontAddForm from '@/app/components/medicaldata/Consent/newconsent/add';
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
       <ConsontAddForm params={params} />
       </Suspense>
     
      
    </div>
  );
}