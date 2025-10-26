"use client";


import FetchInvoices from '@/app/components/invoice/report/report';
 // Import Spinner component

export default function Home() {
  
  // Once loading is complete, render the actual content
  return (

    <div className='bg-gray-100'>
      <FetchInvoices/>
    </div>
  );
}
