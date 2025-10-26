"use client";

import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";
import EditTreatmentPlanComponent from "@/app/components/medicaldata/TreatmentPlan/edit/edit";

const EditTreatmentPlanPageContent = () => {
  const searchParams = useSearchParams(); // Updated to handle query parameters in Next.js 13+
  const treatmentPlanId = searchParams?.get("treatmentPlanId") || ""; // Default to an empty string
  const patientId = searchParams?.get("patientId") || ""; // Default to an empty string

  useEffect(() => {
    if (!treatmentPlanId || !patientId) {
      console.error("Missing treatmentPlanId or patientId");
    }
  }, [treatmentPlanId, patientId]);

  return (
    <div>
      <h1>Edit Treatment Plan</h1>
      <div>
        <EditTreatmentPlanComponent params={{ patientId, treatmentPlanId }} />
      </div>
    </div>
  );
};

const EditTreatmentPlanPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <EditTreatmentPlanPageContent />
  </Suspense>
);

export default EditTreatmentPlanPage;
