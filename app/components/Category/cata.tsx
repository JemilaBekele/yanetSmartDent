"use client";

import React, { useState, useEffect } from "react";

type EditCategoryModalProps = {
  isOpen: boolean;
  formData: { id?: string; name: string } | null;
  onClose: () => void;
  onUpdate: (data: { id?: string; name: string }) => void;
};

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  formData,
  onClose,
  onUpdate,
}) => {
  const [categoryData, setCategoryData] = useState<{ id?: string; name: string }>({
    id: "",
    name: "",
  });

  useEffect(() => {
    if (formData) setCategoryData(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCategoryData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(categoryData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Category Name
            </label>
            <input
              type="text"
              name="name"
              value={categoryData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;
