"use client";


import CardPage from '@/app/components/card/all/allcard';



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
      <CardPage params={params} />
      
    </div>
  );
}
