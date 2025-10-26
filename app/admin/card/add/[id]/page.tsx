"use client";


import CreateCardPage from '@/app/components/card/add/addcard';



// Import Spinner component

type PatientDetailsProps = {
  params: {
    id: string;
  };
};
export default function Home({ params }: PatientDetailsProps) {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <CreateCardPage params={params} />
      
    </div>
  );
}
