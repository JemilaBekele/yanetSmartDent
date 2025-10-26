"use client";

import EditMedicalFindingForm from "@/app/components/medicaldata/medicaldata/medicalhistory/edit/edit";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";

const EditMedicalPageContent = () => {
  const searchParams = useSearchParams(); // Updated to handle query parameters in Next.js 13+
  const findingId = searchParams?.get("findingId") || ""; // Default to an empty string
  const patientId = searchParams?.get("patientId") || ""; // Default to an empty string

  useEffect(() => {
    if (!findingId || !patientId) {
      console.error("Missing findingId or patientId");
    }
  }, [findingId, patientId]);

  return (
    <div>
      <h1>Edit Medical Finding</h1>
      <div>
        <EditMedicalFindingForm params={{ patientId, findingId }} />
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
