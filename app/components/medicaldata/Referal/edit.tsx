import React, { useState, useEffect } from "react";

type CertificateData = {
  _id: string;
  HPI: string;
  PysicalFindings: string;
  InvestigationResult: string;
  Diagnosis: string;
  ReasonForReferral: string;
  Referring: string;
  Physical: string;
};

interface EditCertificateModalProps {
  isOpen: boolean;
  formData: CertificateData | null;
  onClose: () => void;
  onUpdate: (data: CertificateData) => Promise<void>;
}

const EditReferralModal: React.FC<EditCertificateModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [localData, setLocalData] = useState<CertificateData | null>(formData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  if (!isOpen || !localData) return null;

  const validateForm = () => {
    const formErrors: { [key: string]: string } = {};
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleChange = (field: keyof CertificateData, value: string) => {
    setLocalData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() && localData) {
      await onUpdate(localData);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Referral</h2>
        <form onSubmit={handleSubmit}>
          {[
            "HPI",
            "PysicalFindings",
            "InvestigationResult",
            "Diagnosis",
            "ReasonForReferral",
            "Referring",
            "Physical",
          ].map((field) => (
            <div className="mb-4" key={field}>
              <label className="block font-bold mb-2" htmlFor={field}>
                {field.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <textarea
                id={field}
                value={localData[field as keyof CertificateData] || ""}
                onChange={(e) => handleChange(field as keyof CertificateData, e.target.value)}
                className="border p-2 rounded-md w-full"
                placeholder={`Enter ${field.replace(/([A-Z])/g, " $1").trim()}`}
                rows={3}
              ></textarea>
              {errors[field] && <p className="text-red-500">{errors[field]}</p>}
            </div>
          ))}

          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-4 text-red-600 hover:text-red-800">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReferralModal;
