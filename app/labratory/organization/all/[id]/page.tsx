"use client";


import OrganizationPage from '@/app/components/organazation/all/all';
import { Suspense } from 'react';

// Import Spinner component

type PatientDetailsProps = {
  params: {
    id: string;
  };
};
export default function Orgaall({ params }: PatientDetailsProps) {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <OrganizationPage params={params} />
      </Suspense>
    
      
    </div>
  );
}