"use client";


import VitalSignsForm from '@/app/components/medicaldata/medicaldata/healthinfo/vital';
import { Suspense } from 'react';
// Import Spinner component

type HealthFindingFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: HealthFindingFormProps) {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <VitalSignsForm params={params} />
      
      </Suspense>

      
    </div>
  );
}
