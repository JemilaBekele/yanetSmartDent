"use client";


import DentalChartViewer from '@/app/components/DentalChart/bb';
import MedicalFindingForm from '@/app/components/medicaldata/medicaldata/medicalhistory/all/allmedical'
import { Suspense } from 'react';
// Import Spinner component

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: MedicalFindingFormProps) {
  

  // Once loading is complete, render the actual content
  return (

    <div >
       <Suspense >
               <DentalChartViewer params={params} />
        
       <MedicalFindingForm params={params} />
       
       </Suspense>
      
      
    </div>
  );
}
