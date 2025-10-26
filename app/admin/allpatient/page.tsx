

"use client";



import { Component } from '@/app/components/static/branch';
import { Suspense } from 'react';

// Import Spinner component

export default function Dis() {
 

  // Once loading is complete, render the actual content
  return (

    <div >
      <Suspense fallback={<div>Loading...</div>}>
      <Component />
      </Suspense>
    
      
    </div>
  );
}
