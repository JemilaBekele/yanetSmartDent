





"use client";


import EditOrthodonticsForm from "@/app/components/medicaldata/Orthodontics/edit";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";

const EditMedicalPageContent = () => {
  const searchParams = useSearchParams(); // Updated to handle query parameters in Next.js 13+
  const findingId = searchParams?.get("findingId") || ""; // Default to an empty string
  const id = searchParams?.get("patientId") || ""; // Default to an empty string

  useEffect(() => {
    if (!findingId || !id) {
      console.error("Missing findingId or patientId");
    }
  }, [findingId, id]);

  return (
    <div>
      <h1>Edit Medical Finding</h1>
      <div>
        <EditOrthodonticsForm params={{ id, findingId }} />
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
