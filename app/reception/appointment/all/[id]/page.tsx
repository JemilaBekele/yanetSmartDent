"use client";


import AppointmentList from '@/app/components/medicaldata/medicaldata/appointment/all/allappointment'
import { Suspense } from 'react';
 // Import Spinner component

type AppointmentListProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: AppointmentListProps) {
  

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <AppointmentList params={params} />
      
      </Suspense>
     
      
    </div>
  );
}
