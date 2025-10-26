"use client";

import { useEffect, useState } from 'react';
import InvoiceAll from '@/app/components/medicaldata/Invoice/all/allinvoice'

import Spinner from '@/app/components/ui/Spinner'; // Import Spinner component

type InvoiceFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: InvoiceFormProps) {
  const [loading, setLoading] = useState(true);
  
  // Simulate data loading or component readiness
  useEffect(() => {
    // Assume the components take some time to load, like fetching data
    setTimeout(() => {
      setLoading(false); // Set loading to false once "data" is "loaded"
    }, 1500); // Adjust this delay as necessary
  }, []);

  // If still loading, display the spinner
  if (loading) {
    return <Spinner />;
  }

  // Once loading is complete, render the actual content
  return (

    <div >
      <InvoiceAll params={params} />
      
    </div>
  );
}
