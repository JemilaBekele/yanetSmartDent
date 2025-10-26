"use client";

import TreatmentPlanForm from '@/app/components/medicaldata/TreatmentPlan/add/add';
import { Suspense } from 'react';

// Import Spinner component

type PrescriptionFormProps= { 
  params: {
    id: string;
  };
};
export default function Home({ params }: PrescriptionFormProps){ 
  

  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
       
       <TreatmentPlanForm  params={params} />
       </Suspense>
  
      
    </div>
  );
}
