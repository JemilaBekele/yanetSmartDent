"use client";




import OrthodonticsForm from '@/app/components/medicaldata/Orthodontics/add';

import { Suspense } from 'react';
 // Import Spinner component

type CreaditFormProps = {
  params: {
    id: string;
  };
};
export default function Ortho({ params }: CreaditFormProps) {
  
  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       <OrthodonticsForm params={params} />
       </Suspense>
     
      
    </div>
  );
}