"use client";


import MedicalFindingForm from '@/app/components/medicaldata/medicaldata/medicalhistory/add/addmedical'
import { Suspense } from 'react';
// Import Spinner component

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: MedicalFindingFormProps) {


  // Once loading is complete, render the actual content
  return (

    <div >
         <Suspense >
         
         <MedicalFindingForm params={params} />
         </Suspense>
      
      
    </div>
  );
}
