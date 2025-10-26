





"use client";


import ConsontUpdateForm from "@/app/components/medicaldata/Consent/eidit";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";

const EditMedicalPageContent = () => {
  const searchParams = useSearchParams(); // Updated to handle query parameters in Next.js 13+
  const findId = searchParams?.get("findingId") || ""; // Default to an empty string
  const id = searchParams?.get("patientId") || ""; // Default to an empty string

  useEffect(() => {
    if (!findId || !id) {
      console.error("Missing findingId or patientId");
    }
  }, [findId, id]);

  return (
    <div>
      <h1>Edit Medical Finding</h1>
      <div>
        <ConsontUpdateForm params={{ id, findId }} />
      </div>
    </div>
  );
};

const EditMedicalPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <EditMedicalPageContent />
  </Suspense>
);

export default EditMedicalPage;
