"use client";


import AddDentalChartViewer from '@/app/components/DentalChart/add/bb';
import { Suspense } from 'react';
// Import Spinner component

type AppointmentFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: AppointmentFormProps) {
  

  // If still loading, display the spinner
   
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense fallback={<div>Loading...</div>}>
       <AddDentalChartViewer params={params} />
       </Suspense>
      
      
    </div>
  );
}
