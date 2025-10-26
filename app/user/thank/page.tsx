// ThankYouPage.js
"use client";
import { useRouter } from 'next/navigation';
import React from 'react';
import Image from 'next/image';
import {  signOut } from "next-auth/react";
export default function ThankYouPage() {
  const router = useRouter();
 const handleLogout = async () => {
    await signOut({ redirect: false }); // Perform client-side sign-out
    router.push('/'); // Redirect to sign-in page after logout
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
      <div className="flex flex-col items-center py-6">
              <Image 
                     src="/assets/file.png" // Path to your image
                     alt="Example Image"
                     width={150}  // Desired width
                     height={150} // Desired height
                     priority    // Optional: load the image with high priority
                   />
                <h2 className="mt-3 text-2xl font-bold text-black-900">Yanet Special Dental Clinic</h2>
            </div>
  
        
        
        <h1 className="text-2xl font-bold mb-4">Thank You!</h1>
        <p className="mb-6">Your health information has been successfully submitted.</p>
        
        <button 
          className="bg-green-500 text-white px-6 py-3 rounded-md 
                     hover:bg-green-600 w-full mt-4"
                     onClick={handleLogout}
        >
          Ok
        </button>
      </div>
    </div>
  );
}