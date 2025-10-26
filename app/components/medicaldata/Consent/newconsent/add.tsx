"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PatientComponent from "@/app/components/patient/PatientComponent";

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};

type FormData = {
  
  Treatmenttype: string;
  createdBy: {
    id: string;
    username: string;
  };
};

const InputField = ({
  label,
  id,
  name,
  value,
  onChange,
  isTextArea = false,
  error = "",
}: {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextArea?: boolean;
  required: false;
  error?: string;
}) => (
  <div className="mt-6">
    <label htmlFor={id} className="block text-gray-700 font-semibold mb-2">
      {label}
    </label>
    {isTextArea ? (
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 ease-in-out ${error ? "border-red-500" : "border-gray-300"}`}
        rows={Math.max(3, Math.ceil(value.length / 100))}
      />
    ) : (
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 ease-in-out ${error ? "border-red-500" : "border-gray-300"}`}
      />
    )}
    {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
  </div>
);



export default function ConsontAddForm({ params }: MedicalFindingFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

  const [formData, setFormData] = useState<FormData>({
 

    Treatmenttype: "",
    createdBy: {
      id: session?.user?.id || "",
      username: session?.user?.username || "",
    },
  });

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormData
  ) => {
    const { checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [field]: checked,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/Consent/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("Form submitted successfully");
        if (role === "doctor") {
          router.push(`/doctor/ConsentDisplay/all/${patientId}`);
        } else if (role === "admin") {
          router.push(`/admin/ConsentDisplay/all/${patientId}`);
        }
        else if (role === "reception") {
          router.push(`/reception/ConsentDisplay/all/${patientId}`);
        }
      } else {
        console.error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Consent</h1>

            <form onSubmit={handleSubmit} >


  <InputField
    label="Treatment Type"
    id="Treatmenttype"
    name="Treatmenttype"
    required={false}
    value={formData.Treatmenttype}
    onChange={handleInputChange}
    isTextArea={true}
  />

  <button type="submit" className="col-span-3 bg-green-500 mt-5 text-white py-2 px-4 rounded">
    Submit
  </button>
</form>

        </div>
      </div>
    </div> </div>
  );
}
