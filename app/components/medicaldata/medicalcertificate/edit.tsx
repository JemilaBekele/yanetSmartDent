import React, { useState, useEffect } from "react";

// Define types for consistency
type CertificateData = {
  _id: string;
  briefExplanation: string;
  diagnosis: string;
  createdAt: string;
  restDate: string; // Storing rest date as a string
};

interface EditCertificateModalProps {
  isOpen: boolean;
  formData: CertificateData | null;
  onClose: () => void;
  onUpdate: (data: CertificateData) => Promise<void>;
}

const EditCertificateModal: React.FC<EditCertificateModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [localData, setLocalData] = useState<CertificateData | null>(formData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sync local state with incoming formData
  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  if (!isOpen || !localData) return null;

  // Validation function
  const validateForm = () => {
    const formErrors: { [key: string]: string } = {};

  

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (field: keyof CertificateData, value: string) => {
    setLocalData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (localData) {
        await onUpdate(localData); // Call parent handler with updated data
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Certificate</h2>
        <form onSubmit={handleSubmit}>
          {/* Diagnosis */}
          <div className="mb-4">
            <label className="block font-bold mb-2" htmlFor="diagnosis">
              Diagnosis
            </label>
            <input
              id="diagnosis"
              value={localData.diagnosis}
              onChange={(e) => handleChange("diagnosis", e.target.value)}
              className="border p-2 rounded-md w-full"
              placeholder="e.g., Severe flu"
            />
            {errors.diagnosis && <p className="text-red-500">{errors.diagnosis}</p>}
          </div>

          {/* Brief Explanation */}
          <div className="mb-4">
            <label className="block font-bold mb-2" htmlFor="briefExplanation">
              Brief Explanation
            </label>
            <textarea
              id="briefExplanation"
              value={localData.briefExplanation}
              onChange={(e) => handleChange("briefExplanation", e.target.value)}
              className="border p-2 rounded-md w-full"
              placeholder="e.g., Patient requires rest for recovery."
              rows={3}
            ></textarea>
            {errors.briefExplanation && <p className="text-red-500">{errors.briefExplanation}</p>}
          </div>

          {/* Rest Day (as a string) */}
          <div className="mb-4">
            <label className="block font-bold mb-2">Rest Day</label>
            <input
              type="text" // Allows any string input (manual entry)
              value={localData.restDate}
              onChange={(e) => handleChange("restDate", e.target.value)}
              className="border p-2 rounded-md w-full"
              placeholder="e.g., 3 days / One week / Until Monday"
            />
            {errors.restDate && <p className="text-red-500">{errors.restDate}</p>}
          </div>

          {/* Action Buttons */}
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

export default EditCertificateModal;
