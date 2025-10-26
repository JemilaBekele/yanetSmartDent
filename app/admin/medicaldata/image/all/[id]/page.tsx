"use client";


import PatientImages from '@/app/components/medicaldata/medicaldata/image/all/allimage'
import { Suspense } from 'react';
// Import Spinner component

type PatientImagesProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: PatientImagesProps) {
  

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <PatientImages params={params} />
      </Suspense>
      
      
    </div>
  );
}
