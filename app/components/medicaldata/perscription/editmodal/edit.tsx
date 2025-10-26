import React, { useState, useEffect } from "react";

// Align the types for consistency
type PrescriptionData = {
  _id: string;
  Name: string;
  diagnosis: string;
  description: string;
  createdAt?: string;
  createdBy?: { username: string };
};

interface EditPrescriptionModalProps {
  isOpen: boolean;
  formData: PrescriptionData | null;
  onClose: () => void;
  onUpdate: (data: PrescriptionData) => Promise<void>; // Allow async updates
}

const EditPrescriptionModal: React.FC<EditPrescriptionModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [localData, setLocalData] = useState<PrescriptionData | null>(formData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sync local state when formData changes
  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  if (!isOpen || !localData) return null;

  // ✅ Validation function
  const validateForm = () => {
    const formErrors: { [key: string]: string } = {};
  
    if (!localData) {
      setErrors(formErrors);
      return false; // Return false if localData is null
    }
  
  
    if (!localData.description?.trim()) {
      formErrors.description = "Prescription description is required.";
    }
  
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };
  

  // ✅ Handle input change
  const handleChange = (field: keyof PrescriptionData, value: string) => {
    setLocalData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // ✅ Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (localData) {
      onUpdate(localData); // Pass updated data to the parent
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Edit Prescription</h2>
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
       

          {/* Diagnosis Field */}
          <div className="mb-4">
            <label className="block font-bold mb-2" htmlFor="diagnosis">
              Diagnosis
            </label>
            <input
              id="diagnosis"
              value={localData.diagnosis}
              onChange={(e) => handleChange("diagnosis", e.target.value)}
              className={`border p-2 rounded-md w-full ${
                errors.diagnosis ? "border-red-500" : ""
              }`}
              placeholder="e.g., Bacterial infection"
            />
            {errors.diagnosis && <p className="text-red-500">{errors.diagnosis}</p>}
          </div>

          {/* Prescription Description */}
          <div className="mb-4">
            <label className="block font-bold mb-2" htmlFor="description">
              Prescription Description
            </label>
            <textarea
              id="description"
              value={localData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className={`border p-2 rounded-md w-full ${
                errors.description ? "border-red-500" : ""
              }`}
              placeholder="e.g., Take Amoxicillin 500mg, three times a day for 7 days"
              rows={4}
            ></textarea>
            {errors.description && <p className="text-red-500">{errors.description}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 text-red-600 hover:text-red-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPrescriptionModal;
