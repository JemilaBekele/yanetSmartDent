"use client";


import TreatmentPlanPage from '@/app/components/medicaldata/TreatmentPlan/all/all';
import { Suspense } from 'react';

// Import Spinner component

type TreatmentPlanFormProps= { 
  params: {
    id: string;
  };
};
export default function Home({ params }: TreatmentPlanFormProps){ 
  

  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense fallback={<div>Loading...</div>}>
       
       <TreatmentPlanPage params={params} />
       </Suspense>
  
      
    </div>
  );
}
