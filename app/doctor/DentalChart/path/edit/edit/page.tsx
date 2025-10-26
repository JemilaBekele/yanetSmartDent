"use client";

import ChildDentalChartEdit from "@/app/components/DentalChart/edit/child/edit";
import DentalChartEdit from "@/app/components/DentalChart/edit/edit";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useEffect } from "react";

const EditDentalchartPageContent = () => {
  const searchParams = useSearchParams();

  const dentalChartId = searchParams?.get("dentalChartId") || "";
  const patientId = searchParams?.get("patientId") || "";
  const isChildParam = searchParams?.get("isChild") || "false"; // ✅ Get from URL
  const isChild = isChildParam === "true"; // ✅ Convert to boolean

  useEffect(() => {
    if (!dentalChartId || !patientId) {
      console.error("Missing dentalChartId or patientId");
    }
  }, [dentalChartId, patientId]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-800">
        {isChild ? "Edit Child Dental Chart" : "Edit Dental Chart"}
      </h1>

      <div className="mt-4">
        {isChild ? (
          <ChildDentalChartEdit params={{ patientId, dentalChartId }} />
        ) : (
          <DentalChartEdit params={{ patientId, dentalChartId }} />
        )}
      </div>
    </div>
  );
};

const EditDentalChartPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <EditDentalchartPageContent />
  </Suspense>
);

export default EditDentalChartPage;
