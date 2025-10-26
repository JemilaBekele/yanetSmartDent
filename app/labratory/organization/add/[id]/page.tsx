"use client";


import CreateOrgnazationPage from '@/app/components/organazation/add/addorg';
import { Suspense } from 'react';

// Import Spinner component

type PatientDetailsProps = {
  params: {
    id: string;
  };
};
export default function Orga({ params }: PatientDetailsProps) {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <CreateOrgnazationPage params={params} />
      </Suspense>
    
      
    </div>
  );
}