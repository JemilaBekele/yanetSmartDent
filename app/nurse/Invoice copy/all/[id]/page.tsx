"use client";


import InvoiceAll from '@/app/components/medicaldata/Invoice/all/allinvoice'

import { Suspense } from 'react'; // Import Spinner component

type InvoiceFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: InvoiceFormProps) {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <InvoiceAll params={params} />
      
      </Suspense>
      
      
    </div>
  );
}
