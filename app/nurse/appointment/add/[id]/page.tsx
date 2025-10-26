"use client";


import AppointmentForm from '@/app/components/medicaldata/medicaldata/appointment/add/addappointment'
import { Suspense } from 'react';

type AppointmentFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: AppointmentFormProps) {
 
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       <AppointmentForm params={params} />
       </Suspense>
      
      
    </div>
  );
}
