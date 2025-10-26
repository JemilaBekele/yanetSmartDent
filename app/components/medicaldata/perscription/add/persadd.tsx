"use client";

import React, { useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type PrescriptionFormProps = {
  params: {
    id: string; // Patient ID
  };
};

const MEDICATION_OPTIONS = [
  "Amoxacillin 500mg po TID for 7 day",
  "Amoxacillin 250 mg po TID for 7 days",
  "Amoxacillin 125 mg /5ml po Tid 7 days",
  "Amoxacillin 250 mg /5ml Po TID 7 days",
  "Metrondazole 500 mg po TID for 7 days",
  "Metrondazole 250 mg po TID 7 days",
  "Metrondazole 125mg /5ml po TID 7 days",
  "Metrondazole 250mg /5ml Po TID 7days",
  "Azithromycin 500mg PO OD 3 days",
  "Augmentine 625 mg PO TID 7 days",
  "Augmentine 375mg PO TID 7 days",
  "Aarloflox 200mg/500mg PO BID for 7 days",
  "Doxycycline 100mg Po BID for 7 days",
  "Amoklavin 1000mg BID for 7 days",
  "Paracetamol 500 mg po prn",
  "Paracetamol 250 mg /5ml PO Prn",
  "Paracetamol 120mg /5ml",
  "Ibuprofen 400 mg PO prn",
  "Ibuprofen 200mg/5ml po prn",
  "Ibuprofen 100mg /5ml PO prn",
  "Diclofenac 50 mg PO Prn",
  "Omeprazol 20mg PO OD for 5 days",
  "Gofen 400 mg PO Prn",
  "Fluconazole oral gel 0.5% BID for 7 days",
  "0.2% Chlorohexidine mouth wash BID for 14 days",
  "3% Hydrogen peroxide BID for 5 days",
  "Etricox 90 mg PO Prn",
  "klamiks 1000mg PO BID For 5 days"
];

export default function PrescriptionForm({ params }: PrescriptionFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    diagnosis: "",
    description: "",
  });

  const [selectedMedication, setSelectedMedication] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const role = useMemo(() => session?.user?.role || "", [session]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);

  // Filter medications based on search term
const filteredMedications = useMemo(() => {
  return MEDICATION_OPTIONS.filter(med =>
    med.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [searchTerm]);


  const handleAddMedication = () => {
    if (selectedMedication) {
      setFormData(prev => ({
        ...prev,
        description: prev.description 
          ? `${prev.description}\n${selectedMedication}`
          : selectedMedication
      }));
      setSelectedMedication("");
      setSearchTerm(""); // Clear search after adding
    }
  };

  // ✅ Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset messages
    setFormMessage(null);
    setFormType(null);

    try {
      const response = await fetch(`/api/perscription/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: formData.name,
          diagnosis: formData.diagnosis,
          description: formData.description,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error submitting form:", errorText);
        setFormMessage("An error occurred while creating the prescription.");
        setFormType("error");
        return;
      }

      setFormMessage("Prescription created successfully!");
      setFormType("success");

      // Redirect based on role
      if (role === "doctor") {
        router.push(`/doctor/prescriptions/all/${patientId}`);
      } else if (role === "admin") {
        router.push(`/admin/prescriptions/all/${patientId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormMessage("An unexpected error occurred. Please try again.");
      setFormType("error");
    }
  };

  // ✅ Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Prescription Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Create Prescription</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Name Field */}
            

              {/* Diagnosis Field */}
              <div className="mt-4">
                <label htmlFor="diagnosis" className="block font-bold mb-2">
                  Diagnosis
                </label>
                <input
                  id="diagnosis"
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${
                    errors.diagnosis ? "border-red-500" : ""
                  }`}
                  placeholder="e.g., Bacterial infection"
                />
                {errors.diagnosis && (
                  <p className="text-red-500">{errors.diagnosis}</p>
                )}
              </div>

              {/* Medication Selection */}
              <div className="mt-4">
                <label htmlFor="medication" className="block font-bold mb-2">
                  Add Medication
                </label>
                <div className="flex flex-col gap-2">
                  {/* Search Input */}
                  <input
                    type="text"
                    placeholder="Search medications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border p-2 rounded-md w-full"
                  />
                  
                  {/* Medication Dropdown */}
                  <div className="flex gap-2">
                    <select
                      id="medication"
                      value={selectedMedication}
                      onChange={(e) => setSelectedMedication(e.target.value)}
                      className="border p-2 rounded-md flex-grow"
                    >
                      <option value="">Select a medication</option>
                      {filteredMedications.map((med, index) => (
                        <option key={index} value={med}>
                          {med}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                      disabled={!selectedMedication}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Prescription Description Field */}
              <div className="mt-4">
                <label htmlFor="description" className="block font-bold mb-2">
                  Prescription Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full h-40 ${
                    errors.description ? "border-red-500" : ""
                  }`}
                  placeholder="e.g., Take Amoxicillin 500mg, three times a day for 7 days"
                ></textarea>
                {errors.description && (
                  <p className="text-red-500">{errors.description}</p>
                )}
              </div>

              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
              >
                Submit
              </button>
            </form>

            {formMessage && (
              <p
                className={`mt-4 p-2 rounded-md ${
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