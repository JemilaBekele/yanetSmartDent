"use client";


import CompanyProfileForm from '@/app/components/campanyProfile/add';
import CreateCardPage from '@/app/components/card/add/addcard';



// Import Spinner component


export default function Home() {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <CompanyProfileForm />
      
    </div>
  );
}
