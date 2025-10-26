import React, { useState, useEffect } from "react";

type Service = {
    id?: string; // Optional _id
    service: string;
    price: number;
  };

interface EditServiceProps {
  isOpen: boolean;
  formData: Service | null;
  onClose: () => void;
  onUpdate: (data: Service) => Promise<void>;
}

const EditServiceModal: React.FC<EditServiceProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [localData, setLocalData] = useState<Service | null>(formData);

  useEffect(() => {
    setLocalData(formData);
  }, [formData]);

  if (!isOpen || !localData) return null;

  const handleChange = (field: keyof Service, value: string | number) => {
    setLocalData({ ...localData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (localData) {
      await onUpdate(localData);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-lg max-h-screen overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Edit Medical Record</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block font-bold mb-2" htmlFor="service">
              Service
            </label>
            <input
              id="service"
              type="text"
              value={localData?.service || ""}
              onChange={(e) => handleChange("service", e.target.value)}
              className="border p-2 rounded-md w-full"
              placeholder="Enter service"
            />
          </div>
          <div className="mb-4">
            <label className="block font-bold mb-2" htmlFor="price">
              Price
            </label>
            <input
              id="price"
              type="number"
              value={localData?.price || 0}
              onChange={(e) => handleChange("price", parseFloat(e.target.value))}
              className="border p-2 rounded-md w-full"
              placeholder="Enter price"
            />
          </div>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-4 text-red-600">
              Cancel
            </button>
            <button type="submit" className="bg-blue-500 text-white p-2 rounded-md">
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServiceModal;
