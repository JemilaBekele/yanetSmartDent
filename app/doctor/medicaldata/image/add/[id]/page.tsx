"use client";


import ImageForm from '@/app/components/medicaldata/medicaldata/image/add/addimage'
import { Suspense } from 'react';
 // Import Spinner component

type ImageFormProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: ImageFormProps) {
 
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <ImageForm params={params} />
      </Suspense>
      
      
    </div>
  );
}
