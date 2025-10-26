

"use client";

import ComprehensiveInventoryDashboard from '@/app/components/inventory/dashboard/finaldashboard';
import Spinner from '@/app/components/ui/Spinner';
import { useEffect, useState } from 'react';


export default function Home() {
  const [loading, setLoading] = useState(true);

  // Simulate data loading or component readiness
  useEffect(() => {
    // Assume the components take some time to load, like fetching data
    setTimeout(() => {
      setLoading(false); // Set loading to false once "data" is "loaded"
    }, 1500); // Adjust this delay as necessary
  }, []);

  // If still loading, display the spinner
  if (loading) {
    return <Spinner />;
  }

  // Once loading is complete, render the actual content
  return (

    <>
    <div className="flex ml-15 mt-10">
      <div className="flex-grow md:ml-60 container mx-auto">
      <ComprehensiveInventoryDashboard /></div></div>
    </>
  );
}
