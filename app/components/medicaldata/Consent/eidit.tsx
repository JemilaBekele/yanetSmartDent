"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PatientComponent from "../../patient/PatientComponent";
import axios from "axios";

type MedicalFindingFormProps = {
  params: {
    id: string;
    findId: string;
  };
};

type FormData = {
    _id?: string;
    __v: string;
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
  createdBy?:string
};

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
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 border-2 border-gray-300 rounded-md text-indigo-600 focus:ring-indigo-500 focus:ring-2 transition-all duration-200 ease-in-out"
    />
    <label className="text-gray-700 font-medium cursor-pointer select-none hover:text-indigo-600 transition-colors duration-200">
      {label}
    </label>
  </div>
);

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

export default function ConsentUpdateForm({ params }: MedicalFindingFormProps) {
    const { id: patientId, findId } = params;
    const router = useRouter();
    const { data: session } = useSession();
    const role = useMemo(() => session?.user?.role || "", [session]);
  
    const [formData, setFormData] = useState<FormData>({
      __v: "",  // Add a default value for __v here
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
      Treatmenttype: ""
    });
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const { data } = await axios.get(`/api/Consent/detail/${findId}`);
          const fetchedData = data.data || data;
  
          setFormData((prev) => ({
            ...prev,
            ...fetchedData,
            allergies: fetchedData.allergies === "true" || fetchedData.allergies === true,
          }));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
  
      fetchData();
    }, [findId]);
  
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, checked } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    };
  
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
  
      // Remove fields _id and __v from the submission data
      const { ...filteredData } = formData;
  
      try {
        const response = await axios.patch(`/api/Consent/detail/${findId}`, filteredData);
        if (response.status === 200) {
          if (role === "doctor") {
            router.push(`/doctor/Consent/all/${patientId}`);
          } else if (role === "admin") {
            router.push(`/admin/Consent/all/${patientId}`);
          }
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
              <h1 className="text-2xl font-bold mb-4">Edit Consent</h1>
              <form onSubmit={handleSubmit}>
                {/* Wrap the checkboxes in a container to make them appear in three columns */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {Object.keys(formData)
                    .filter((key) => key !== "__v" && key !== "_id" && key !== "createdBy") // Exclude __v and _id fields
                    .map((key) =>
                      typeof formData[key] === "boolean" ? (
                        <CheckboxField
                          key={key}
                          label={key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}

                          name={key}
                          checked={formData[key]}
                          onChange={handleCheckboxChange}
                        />
                      ) : null // Only render checkboxes for boolean keys
                    )}
                </div>
                <InputField
                  label="Other"
                  id="other"
                  name="other"
                  value={formData.other}
                  onChange={handleInputChange}
                  isTextArea={true}
                />
                <InputField
                  label="Treatment Type"
                  id="Treatmenttype"
                  name="Treatmenttype"
                  isTextArea={true}
                  value={formData.Treatmenttype}
                  onChange={handleInputChange}
                />
                <button type="submit" className="bg-green-500 mt-5 text-white py-2 px-4 rounded">
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
    );
  }
  