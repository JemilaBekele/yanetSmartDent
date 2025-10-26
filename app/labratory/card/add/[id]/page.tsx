"use client";


import CreateCardPage from '@/app/components/card/add/addcard';
import { Suspense } from 'react';

// Import Spinner component

type PatientDetailsProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: PatientDetailsProps) {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <CreateCardPage params={params} />
      </Suspense>
    
      
    </div>
  );
}
