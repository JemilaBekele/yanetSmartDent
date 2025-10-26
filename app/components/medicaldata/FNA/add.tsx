"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type FNAFormProps = {
  params: {
    id: string; // Patient ID
  };
};

export default function FNAForm({ params }: FNAFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    CC: "",
    ClinicalFindings: "",
    DurationOfLesion: "",
    Impression: "",
   
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

  

    try {
      const response = await fetch(`/api/FNA/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CC: formData.CC,
          ClinicalFindings: formData.ClinicalFindings,
          DurationOfLesion: formData.DurationOfLesion,
          Impression: formData.Impression,
         
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error submitting form:", errorText);
        setFormMessage("An error occurred while creating the referral certificate.");
        setFormType("error");
        return;
      }

      setFormMessage("FNAcreated successfully!");
      setFormType("success");

      // Redirect based on role
      if (role === "doctor") {
        router.push(`/doctor/FNA/all/${patientId}`);
      } else if (role === "admin") {
        router.push(`/admin/FNA/all/${patientId}`);
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

          {/* FNA Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Create FNA or Biosy Request</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {/* CC */}
              <div className="mt-4">
                <label htmlFor="CC" className="block font-bold mb-2">
                  CC 
                </label>
                <textarea
                  id="CC"
                  name="CC"
                  value={formData.CC}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.CC ? "border-red-500" : ""}`}
                  placeholder="Describe the patient's CC"
                ></textarea>
                {errors.CC && <p className="text-red-500">{errors.CC}</p>}
              </div>

              {/* Physical Findings */}
              <div className="mt-4">
                <label htmlFor="ClinicalFindings" className="block font-bold mb-2">
                Clinical Findings
                </label>
                <textarea
                  id="ClinicalFindings"
                  name="ClinicalFindings"
                  value={formData.ClinicalFindings}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.ClinicalFindings ? "border-red-500" : ""}`}
                  placeholder="Describe the Clinical Findings "
                ></textarea>
                {errors.ClinicalFindings && <p className="text-red-500">{errors.ClinicalFindings}</p>}
              </div>

              {/* Investigation Result */}
              <div className="mt-4">
                <label htmlFor="DurationOfLesion" className="block font-bold mb-2">
                Duration of Lesion
                </label>
                <textarea
                  id="DurationOfLesion"
                  name="DurationOfLesion"
                  value={formData.DurationOfLesion}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.DurationOfLesion ? "border-red-500" : ""}`}
                  placeholder="Duration Of Lesion"
                ></textarea>
                {errors.DurationOfLesion && <p className="text-red-500">{errors.DurationOfLesion}</p>}
              </div>

              {/* Impression */}
              <div className="mt-4">
                <label htmlFor="Impression" className="block font-bold mb-2">
                  Impression
                </label>
                <input
                  id="Impression"
                  name="Impression"
                  value={formData.Impression}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.Impression ? "border-red-500" : ""}`}
                  placeholder=" Impression"
                />
                {errors.Impression && <p className="text-red-500">{errors.Impression}</p>}
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
