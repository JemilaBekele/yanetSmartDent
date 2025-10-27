"use client";


import AdminDentalChartViewer from '@/app/components/DentalChart/admin';
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
               <AdminDentalChartViewer params={params} />
        
       <MedicalFindingForm params={params} />
       
       </Suspense>
      
      
    </div>
  );
}
