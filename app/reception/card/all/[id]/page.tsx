"use client";


import CardPage from '@/app/components/card/all/allcard';

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
      <CardPage params={params} />
      </Suspense>
     
      
    </div>
  );
}
