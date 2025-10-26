

"use client";

import ConsentDisplay from '@/app/components/medicaldata/Consent/all';
import Consentall from '@/app/components/medicaldata/Consent/newconsent/all';
import { Suspense } from 'react';
 // Import Spinner component

type CreaditFormProps = {
  params: {
    id: string;
  };
};
export default function Const({ params }: CreaditFormProps) {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       <Consentall params={params} />
       </Suspense> 
    </div>
  );
}