"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import EditCategoryModal from "@/app/components/Category/cata";


type Category = {
  id?: string; // Optional _id
  name: string;
};
type ApiCategory = {
  _id: string;
  name: string;
};


const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryData, setCategoryData] = useState<Category>({ name: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch categories on load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/Category");
        const normalizedData = response.data.map((category: ApiCategory) => ({
          ...category,
          id: category._id, // Map _id to id
        }));
        
        setCategories(normalizedData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
  
    fetchCategories();
  }, []);
  

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCategoryData((prev) => ({ ...prev, [name]: value }));
  };

  // Add a new category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/Category", categoryData);
      if (response.status === 201) {
        setMessage("Category added successfully!");
        setCategoryData({ name: "" });
        setCategories((prevCategories) => [...prevCategories, response.data.category]);
      } else {
        setMessage("Failed to add category.");
      }
    } catch (error) {
      setMessage("Error adding category.");
      console.error(error);
    }
  };

  // Open edit modal
  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditOpen(true);
  };

  // Update category
  const handleUpdate = async (data: Category) => {
    if (!data.id) return;
    try {
      const response = await axios.patch(`/api/Category/${data.id}`, { id: data.id, name: data.name }, {
        headers: { "Content-Type": "application/json" },
      });
  
      if (response.status === 200) {
        setCategories((prev) =>
          prev.map((category) => (category.id === data.id ? response.data.category : category))
        );
        setMessage("Category updated successfully!");
      } else {
        setMessage("Failed to update category.");
      }
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setIsEditOpen(false);
      setSelectedCategory(null);
    }
  };
  

  // Delete category
  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this category?")) {
      setLoading(true);
      try {
        const response = await axios.delete(`/api/Category/${id}`, {
          data: { id }, 
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (response.status === 200) {
          setCategories((prev) => prev.filter((category) => category.id !== id));
          setMessage("Category deleted successfully!");
        } else {
          setMessage("Failed to delete category.");
        }
      } catch (error) {
        console.error("Error deleting category:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  

  return (
    <div className="bg-gray-100 p-5 rounded-lg mt-20 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Category Management</h1>

      {/* Input Form for Adding Categories */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
        {message && <p className="mb-4 text-green-500">{message}</p>}
        <form onSubmit={handleAddCategory} className="space-y-4">
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
          <div>
            <button
              type="submit"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>

      {/* Table for Displaying and Managing Categories */}
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-4">Category Name</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-t">
              <td className="p-4">{category.name}</td>
              <td className="p-4">
                <button
                  onClick={() => handleEdit(category)}
                  className="text-blue-500 hover:underline mr-4"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="text-red-500 hover:underline"
                  disabled={loading}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      <EditCategoryModal
        isOpen={isEditOpen}
        formData={selectedCategory}
        onClose={() => setIsEditOpen(false)}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

export default CategoryManagement;
