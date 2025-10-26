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

// Make all fields optional by adding `?` after each key
interface HealthInfoFormData {
  bloodgroup?: string;
  weight?: string;
  height?: string;
  allergies?: string;
  Medication?: string;
  habits?: string;
  Hypertension: string;
  Hypotension: string;
  Tuberculosis: string;
  Hepatitis: string;
  Diabetics: string;
  BleedingTendency: string;
  Epilepsy: string;
  Astema: string;
  description: string;
  [key: string]: string | undefined;
}

export default function HealthFindingForm({ params }: HealthinfoFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState<HealthInfoFormData>({
    bloodgroup: "",
    weight: "",
    height: "",
    Medication: "",
    allergies: "",
    habits: "",
    Hypertension: "",
    Hypotension: "",
    Hepatitis: "",
    Tuberculosis: "",
    Diabetics: "",
    BleedingTendency: "",
    Epilepsy: "",
    Astema: "",
    description: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);
  const role = useMemo(() => session?.user?.role || '', [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);
    setFormType(null);

    // Validate required fields
    const newErrors: { [key: string]: string } = {};
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
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

  // Organized form fields by category
  const basicInfoFields = [
    { id: "bloodgroup", label: "Blood Group", type: "select" },
    { id: "weight", label: "Weight", placeholder: "60kg" },
    { id: "height", label: "Height", placeholder: "5.5ft" },
  ];

  const lifestyleFields = [
    { id: "habits", label: "Habits", placeholder: "smoking, drinking" },
    { id: "Medication", label: "Current Medications", placeholder: "List of medications" },
    { id: "allergies", label: "Allergies", placeholder: "beans, nuts, etc." },
  ];

  const medicalConditionsFields = [
    { id: "Hypertension", label: "Hypertension" },
    { id: "Hypotension", label: "Hypotension" },
    { id: "Diabetics", label: "Diabetes" },
    { id: "Astema", label: "Asthma" },
    { id: "Epilepsy", label: "Epilepsy" },
    { id: "BleedingTendency", label: "Bleeding Tendency" },
  ];

  const infectiousDiseasesFields = [
    { id: "Tuberculosis", label: "Tuberculosis/Pneumonia" },
    { id: "Hepatitis", label: "Hepatitis" },
  ];

  const additionalInfoFields = [
    { id: "description", label: "Additional Notes", placeholder: "Any other relevant health information" },
  ];

  const renderField = (field: any) => {
    if (field.type === "select") {
      return (
        <div key={field.id} className="mb-4">
          <label htmlFor={field.id} className="block font-bold mb-2 text-gray-700">
            {field.label}
          </label>
          <select
            id={field.id}
            name={field.id}
            value={formData[field.id] || ""}
            onChange={handleInputChange}
            className={`border p-2 rounded-md w-full ${
              errors[field.id] ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="" disabled>Select Blood Group</option>
            <option value="A+">A-positive</option>
            <option value="A-">A-negative</option>
            <option value="B+">B-positive</option>
            <option value="B-">B-negative</option>
            <option value="AB+">AB-positive</option>
            <option value="AB-">AB-negative</option>
            <option value="O+">O-positive</option>
            <option value="O-">O-negative</option>
          </select>
          {errors[field.id] && (
            <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>
          )}
        </div>
      );
    }

    return (
      <div key={field.id} className="mb-4">
        <label htmlFor={field.id} className="block font-bold mb-2 text-gray-700">
          {field.label}
        </label>
        <input
          id={field.id}
          name={field.id}
          type="text"
          value={formData[field.id] || ""}
          onChange={handleInputChange}
          className={`border p-2 rounded-md w-full ${
            errors[field.id] ? "border-red-500" : "border-gray-300"
          }`}
          placeholder={field.placeholder || ""}
        />
        {errors[field.id] && (
          <p className="text-red-500 text-sm mt-1">{errors[field.id]}</p>
        )}
      </div>
    );
  };

  const renderSection = (title: string, fields: any[], columns: number = 1) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">
        {title}
      </h3>
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
        {fields.map(renderField)}
      </div>
    </div>
  );

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
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Health Information Form</h1>
            </div>

            {/* Form Submission */}
            <form onSubmit={handleSubmit}>
              {/* Basic Information - 2 columns */}
              {renderSection("Basic Information", basicInfoFields, 2)}

              {/* Lifestyle Information - 2 columns */}
              {renderSection("Lifestyle & Medications", lifestyleFields, 2)}

              {/* Medical Conditions - 2 columns */}
              {renderSection("Medical Conditions", medicalConditionsFields, 2)}

              {/* Infectious Diseases - 2 columns */}
              {renderSection("Infectious Diseases History", infectiousDiseasesFields, 2)}

              {/* Additional Information - 1 column */}
              {renderSection("Additional Information", additionalInfoFields, 1)}

              <div className="mt-6 pt-4 border-t">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition duration-200 font-semibold"
                >
                  Submit Health Information
                </button>
              </div>
            </form>

            {formMessage && (
              <div className={`mt-4 p-3 rounded-md ${
                formType === "success"
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}>
                {formMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}