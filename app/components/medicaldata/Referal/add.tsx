"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ReferralCertificateFormProps = {
  params: {
    id: string; // Patient ID
  };
};

export default function ReferralCertificateForm({ params }: ReferralCertificateFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    HPI: "",
    PysicalFindings: "",
    InvestigationResult: "",
    Diagnosis: "",
    ReasonForReferral: "",
    Referring: "",
    Physical: "",
  });

  const role = useMemo(() => session?.user?.role || "", [session]);

  const [errors, ] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    // Validate required fields (customize as needed)
   

   

    try {
      const response = await fetch(`/api/Referal/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          HPI: formData.HPI,
          PysicalFindings: formData.PysicalFindings,
          InvestigationResult: formData.InvestigationResult,
          Diagnosis: formData.Diagnosis,
          ReasonForReferral: formData.ReasonForReferral,
          Referring: formData.Referring,
          Physical: formData.Physical,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error submitting form:", errorText);
        setFormMessage("An error occurred while creating the referral certificate.");
        setFormType("error");
        return;
      }

      setFormMessage("Referral certificate created successfully!");
      setFormType("success");

      // Redirect based on role
      if (role === "doctor") {
        router.push(`/doctor/referral/all/${patientId}`);
      } else if (role === "admin") {
        router.push(`/admin/referral/all/${patientId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormMessage("An unexpected error occurred. Please try again.");
      setFormType("error");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Referral Certificate Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Create Referral Certificate</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {/* HPI */}
              <div className="mt-4">
                <label htmlFor="HPI" className="block font-bold mb-2">
                  HPI (History of Present Illness)
                </label>
                <textarea
                  id="HPI"
                  name="HPI"
                  value={formData.HPI}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.HPI ? "border-red-500" : ""}`}
                  placeholder="Describe the patient's HPI"
                ></textarea>
                {errors.HPI && <p className="text-red-500">{errors.HPI}</p>}
              </div>

              {/* Physical Findings */}
              <div className="mt-4">
                <label htmlFor="PysicalFindings" className="block font-bold mb-2">
                  Physical Findings
                </label>
                <textarea
                  id="PysicalFindings"
                  name="PysicalFindings"
                  value={formData.PysicalFindings}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.PysicalFindings ? "border-red-500" : ""}`}
                  placeholder="Describe the physical findings"
                ></textarea>
                {errors.PysicalFindings && <p className="text-red-500">{errors.PysicalFindings}</p>}
              </div>

              {/* Investigation Result */}
              <div className="mt-4">
                <label htmlFor="InvestigationResult" className="block font-bold mb-2">
                  Investigation Result
                </label>
                <textarea
                  id="InvestigationResult"
                  name="InvestigationResult"
                  value={formData.InvestigationResult}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.InvestigationResult ? "border-red-500" : ""}`}
                  placeholder="Provide investigation results"
                ></textarea>
                {errors.InvestigationResult && <p className="text-red-500">{errors.InvestigationResult}</p>}
              </div>

              {/* Diagnosis */}
              <div className="mt-4">
                <label htmlFor="Diagnosis" className="block font-bold mb-2">
                  Diagnosis
                </label>
                <input
                  id="Diagnosis"
                  name="Diagnosis"
                  value={formData.Diagnosis}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.Diagnosis ? "border-red-500" : ""}`}
                  placeholder="Provide diagnosis"
                />
                {errors.Diagnosis && <p className="text-red-500">{errors.Diagnosis}</p>}
              </div>

              {/* Reason For Referral */}
              <div className="mt-4">
                <label htmlFor="ReasonForReferral" className="block font-bold mb-2">
                  Reason for Referral
                </label>
                <textarea
                  id="ReasonForReferral"
                  name="ReasonForReferral"
                  value={formData.ReasonForReferral}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.ReasonForReferral ? "border-red-500" : ""}`}
                  placeholder="Explain reason for referral"
                ></textarea>
                {errors.ReasonForReferral && <p className="text-red-500">{errors.ReasonForReferral}</p>}
              </div>

              {/* Referring Doctor */}
              <div className="mt-4">
                <label htmlFor="Referring" className="block font-bold mb-2">
                  Referring 
                </label>
                <input
                  id="Referring"
                  name="Referring"
                  value={formData.Referring}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.Referring ? "border-red-500" : ""}`}
                  placeholder="Name of referring doctor"
                />
                {errors.Referring && <p className="text-red-500">{errors.Referring}</p>}
              </div>

              {/* Physical */}
              <div className="mt-4">
                <label htmlFor="Physical" className="block font-bold mb-2">
                  Physical
                </label>
                <textarea
                  id="Physical"
                  name="Physical"
                  value={formData.Physical}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.Physical ? "border-red-500" : ""}`}
                  placeholder="Physical observations"
                ></textarea>
                {errors.Physical && <p className="text-red-500">{errors.Physical}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
              >
                Submit
              </button>
            </form>

            {/* Form Message */}
            {formMessage && (
              <p className={`mt-4 ${formType === "success" ? "bg-green-300 text-green-600" : "bg-red-300 text-red-600"} p-2 rounded-md`}>
                {formMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
