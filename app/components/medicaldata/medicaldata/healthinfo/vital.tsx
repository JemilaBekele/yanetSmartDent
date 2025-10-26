"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type HealthinfoFormProps = {
  params: {
    id: string;
  };
};

// Simplified interface with only vital signs
interface HealthInfoFormData {
  Core_Temperature?: string;
  Respiratory_Rate?: string;
  Blood_Oxygen?: string;
  Blood_Pressure?: string;
  heart_Rate?: string;
  [key: string]: string | undefined;
}

export default function VitalSignsForm({ params }: HealthinfoFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState<HealthInfoFormData>({
    Core_Temperature: "",
    Respiratory_Rate: "",
    Blood_Oxygen: "",
    Blood_Pressure: "",
    heart_Rate: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);
  const role = useMemo(() => session?.user?.role || '', [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    // Validate required fields (Blood_Pressure and heart_Rate)
    const newErrors: { [key: string]: string } = {};
    if (!formData.Blood_Pressure) {
      newErrors.Blood_Pressure = "Blood Pressure is required";
    }
    if (!formData.heart_Rate) {
      newErrors.heart_Rate = "Heart Rate is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop form submission if there are validation errors
    }

    try {
      const response = await fetch(`/api/patient/healthInfo/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to submit form: ${response.status} - ${errorText}`);
        setFormMessage("An error occurred while submitting the form.");
        setFormType("error");
      } else {
        console.log("Form submitted successfully");
        setFormMessage("Form submitted successfully!");
        setFormType("success");
        router.push(`/${role}/medicaldata/healthinfo/all/${patientId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormMessage("An unexpected error occurred. Please try again.");
      setFormType("error");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Vital signs fields only
  const vitalSignsFields = [
    { id: "Core_Temperature", label: "Core Temperature", placeholder: "°C", require: false },
    { id: "Respiratory_Rate", label: "Respiratory Rate", placeholder: "breaths per minute", require: false },
    { id: "Blood_Oxygen", label: "Blood Oxygen", placeholder: "SpO2 %", require: false },
    { id: "Blood_Pressure", label: "Blood Pressure", placeholder: "e.g., 120/80 mmHg", require: true },
    { id: "heart_Rate", label: "Heart Rate", placeholder: "beats per minute", require: true },
  ];

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Medical Findings Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Vital Signs</h1>
            </div>

            {/* Form Submission */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Vital Signs Measurements</h2>
                
                {vitalSignsFields.map((field) => (
                  <div key={field.id} className="mt-4">
                    <label htmlFor={field.id} className="block font-bold mb-2">
                      {field.label} {field.require && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      id={field.id}
                      name={field.id}
                      type="text"
                      value={formData[field.id] || ""}
                      onChange={handleInputChange}
                      className={`border p-2 rounded-md w-full ${errors[field.id] ? "border-red-500" : ""}`}
                      placeholder={field.placeholder}
                    />
                    {errors[field.id] && (
                      <p className="text-red-500">{errors[field.id]}</p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-300 mt-4"
              >
                Submit Vital Signs
              </button>
            </form>

            {formMessage && (
              <p
                className={`mt-4 p-2 rounded ${
                  formType === "success"
                    ? "bg-green-300 text-green-600"
                    : "bg-red-300 text-red-600"
                }`}
              >
                {formMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}