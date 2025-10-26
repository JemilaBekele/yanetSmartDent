import React, { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
};

type Service = {
  id?: string; // Optional identifier
  service: string;
  price: number;
  categoryId: string; // Reference to category
};

interface EditServiceModalProps {
  isOpen: boolean;
  formData: Service | null;
  onClose: () => void;
  onUpdate: (data: Service) => void;
  categories: Category[];
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
  categories,
}) => {
  const [serviceData, setServiceData] = useState<Service>(
    formData || { id: undefined, service: "", price: 0, categoryId: "" }
  );

  useEffect(() => {
    if (formData) setServiceData(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setServiceData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(serviceData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Edit Service</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="service"
            value={serviceData.service}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
            placeholder="Service Name"
            required
          />
          <input
            type="number"
            name="price"
            value={serviceData.price}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
            placeholder="Price"
            required
          />
          <select
            name="categoryId"
            value={serviceData.categoryId}
            onChange={handleChange}
            className="border border-gray-300 rounded px-3 py-2 w-full mb-4"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServiceModal;
