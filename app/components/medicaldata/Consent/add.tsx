"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PatientComponent from "../../patient/PatientComponent";

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};

type FormData = {
  
  allergies: boolean;
  anemia: boolean;
  epilepsy: boolean;
  asthma: boolean;
  DiabetesMellitus: boolean;
  Hypertension: boolean;
  HeartDisease: boolean;
  immuneDeficiency: boolean;
  coagulopathy: boolean;
  organopathy: boolean;
  pregnancy: boolean;
  MedicationsTaken: boolean;
  BleadingDisorder:boolean;
  other: string;
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

const CheckboxField = ({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex items-center space-x-4 mb-4">
    <label className="flex items-center space-x-2 cursor-pointer select-none hover:text-gray-600 transition-colors duration-200">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 border-2 border-gray-300 rounded-md text-gray-600 focus:ring-gray-500 focus:ring-2 transition-all duration-200 ease-in-out"
      />
      <span className="text-gray-700 font-medium">{label}</span>
    </label>
  </div>
);


export default function ConsontFindingForm({ params }: MedicalFindingFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

  const [formData, setFormData] = useState<FormData>({
 
    allergies: false,
    anemia: false,
    epilepsy: false,
    asthma: false,
    DiabetesMellitus: false,
    Hypertension: false,
    HeartDisease: false,
    immuneDeficiency: false,
    coagulopathy: false,
    organopathy: false,
    pregnancy: false,
    MedicationsTaken: false,
    BleadingDisorder:false,
    other: "",
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
          router.push(`/doctor/Consent/all/${patientId}`);
        } else if (role === "admin") {
          router.push(`/admin/Consent/all/${patientId}`);
        }
        else if (role === "reception") {
          router.push(`/reception/Consent/all/${patientId}`);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Column 1 */}
  <CheckboxField
    label="Allergies"
    name="allergies"
    checked={formData.allergies}
    onChange={(e) => handleCheckboxChange(e, "allergies")}
  />
  <CheckboxField
    label="Anemia"
    name="anemia"
    checked={formData.anemia}
    onChange={(e) => handleCheckboxChange(e, "anemia")}
  />
  <CheckboxField
    label="Epilepsy"
    name="epilepsy"
    checked={formData.epilepsy}
    onChange={(e) => handleCheckboxChange(e, "epilepsy")}
  />
  <CheckboxField
    label="Asthma"
    name="asthma"
    checked={formData.asthma}
    onChange={(e) => handleCheckboxChange(e, "asthma")}
  />
  <CheckboxField
    label="Diabetes Mellitus"
    name="DiabetesMellitus"
    checked={formData.DiabetesMellitus}
    onChange={(e) => handleCheckboxChange(e, "DiabetesMellitus")}
  />
  <CheckboxField
    label="Hypertension"
    name="Hypertension"
    checked={formData.Hypertension}
    onChange={(e) => handleCheckboxChange(e, "Hypertension")}
  />
  
  {/* Column 2 */}
  <CheckboxField
    label="Heart Disease"
    name="HeartDisease"
    checked={formData.HeartDisease}
    onChange={(e) => handleCheckboxChange(e, "HeartDisease")}
  />
  <CheckboxField
    label="Immune Deficiency"
    name="immuneDeficiency"
    checked={formData.immuneDeficiency}
    onChange={(e) => handleCheckboxChange(e, "immuneDeficiency")}
  />
  <CheckboxField
    label="Coagulopathy"
    name="coagulopathy"
    checked={formData.coagulopathy}
    onChange={(e) => handleCheckboxChange(e, "coagulopathy")}
  />
  <CheckboxField
    label="Organopathy"
    name="organopathy"
    checked={formData.organopathy}
    onChange={(e) => handleCheckboxChange(e, "organopathy")}
  />
  <CheckboxField
    label="Pregnancy"
    name="pregnancy"
    checked={formData.pregnancy}
    onChange={(e) => handleCheckboxChange(e, "pregnancy")}
  />
  <CheckboxField
    label="Medications Taken"
    name="MedicationsTaken"
    checked={formData.MedicationsTaken}
    onChange={(e) => handleCheckboxChange(e, "MedicationsTaken")}
  />

<CheckboxField
    label="Bleading Disorder"
    name="BleadingDisorder"
    checked={formData.BleadingDisorder}
    onChange={(e) => handleCheckboxChange(e, "BleadingDisorder")}
  />
  </div>

  {/* Column 3 */}
  <InputField
  label="Other"
  id="other"
  name="other"
  required={false}  // Correct usage of the 'required' attribute
  value={formData.other}
  onChange={handleInputChange}
  isTextArea={true}
/>

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
