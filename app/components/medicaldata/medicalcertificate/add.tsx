"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type MedicalCertificateFormProps = {
  params: {
    id: string; // Patient ID
  };
};

export default function MedicalCertificateForm({ params }: MedicalCertificateFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    briefExplanation: "",
    diagnosis: "",
    restDays: "", // Optional
    restDate: "", // Computed only if restDays is provided
  });

  const role = useMemo(() => session?.user?.role || "", [session]);

  const [errors, ] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "restDays") {
        const days = parseInt(value, 10);

        if (!isNaN(days) && days > 0) {
            const today = new Date();
            const formattedToday = today.toISOString().split("T")[0]; // Format: YYYY-MM-DD

            if (days === 1) {
                setFormData({ ...formData, restDays: value, restDate: formattedToday });
            } else {
                const endDate = new Date(today.setDate(today.getDate() + days - 1)).toISOString().split("T")[0];
                setFormData({ ...formData, restDays: value, restDate: `${formattedToday} to ${endDate}` });
            }
        } else {
            setFormData({ ...formData, restDays: value, restDate: "" });
        }
    } else {
        setFormData({ ...formData, [name]: value });
    }
};

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

   
    

    try {
      const response = await fetch(`/api/medicalcerteficate/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefExplanation: formData.briefExplanation,
          diagnosis: formData.diagnosis,
          restDate: formData.restDate || null, // Allow null if no rest days
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error submitting form:", errorText);
        setFormMessage("An error occurred while creating the medical certificate.");
        setFormType("error");
        return;
      }

      setFormMessage("Medical certificate created successfully!");
      setFormType("success");

      // Redirect based on role
      if (role === "doctor") {
        router.push(`/doctor/medicalcertificate/all/${patientId}`);
      } else if (role === "admin") {
        router.push(`/admin/medicalcertificate/all/${patientId}`);
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

          {/* Medical Certificate Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Create Medical Certificate</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Brief Explanation */}
              <div className="mt-4">
                <label htmlFor="briefExplanation" className="block font-bold mb-2">
                  Brief Explanation
                </label>
                <textarea
                  id="briefExplanation"
                  name="briefExplanation"
                  value={formData.briefExplanation}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.briefExplanation ? "border-red-500" : ""}`}
                  placeholder="Provide a brief explanation"
                ></textarea>
                {errors.briefExplanation && <p className="text-red-500">{errors.briefExplanation}</p>}
              </div>

              {/* Diagnosis */}
              <div className="mt-4">
                <label htmlFor="diagnosis" className="block font-bold mb-2">
                  Diagnosis
                </label>
                <input
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.diagnosis ? "border-red-500" : ""}`}
                  placeholder="e.g., Severe Flu"
                />
                {errors.diagnosis && <p className="text-red-500">{errors.diagnosis}</p>}
              </div>

              {/* Number of Rest Days (Optional) */}
              <div className="mt-4">
                <label htmlFor="restDays" className="block font-bold mb-2">
                  Rest Days (Optional)
                </label>
                <input
                  id="restDays"
                  type="number"
                  name="restDays"
                  value={formData.restDays}
                  onChange={handleInputChange}
                  placeholder="Enter number of rest days (optional)"
                  className="border p-2 rounded-md w-full"
                />
              </div>

              {/* Computed Rest Period */}
              {formData.restDate && (
                <div className="mt-4">
                  <label htmlFor="restDate" className="block font-bold mb-2">
                    Rest Period (From - To)
                  </label>
                  <input
                    id="restDate"
                    type="text"
                    name="restDate"
                    value={formData.restDate}
                    readOnly
                    className="border p-2 rounded-md w-full bg-gray-100"
                  />
                </div>
              )}

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
