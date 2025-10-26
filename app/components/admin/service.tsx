"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

type Service = {
  id?: string;
  service: string;
  price: number;
  categoryId: string;
};

type Category = {
  id: string;
  name: string;
};

type ApiCategory = {
  _id: string;
  name: string;
};

interface ServicesPageProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  onEdit: (service: Service) => void;
}

const ServicesPage: React.FC<ServicesPageProps> = ({ services, setServices, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState(""); // New state for filter input

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ApiCategory[]>("/api/Category");
        const normalizedCategories = response.data.map((cat: ApiCategory) => ({
          id: cat._id, 
          name: cat.name,
        }));
        setCategories(normalizedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm("Are you sure you want to delete this service?")) {
      setLoading(true);
      try {
        const response = await axios.delete(`/api/Invoice/Service/${id}`);
        if (response.status === 200) {
          setServices((prev) => prev.filter((service) => service.id !== id));
        }
      } catch (error) {
        console.error("Error deleting service:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtered services based on the filter input
  const filteredServices = services.filter((service) =>
    service.service.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Service List</h2>
      
      {/* Filter input */}
      <input
        type="text"
        placeholder="Filter by service name"
        className="mb-4 p-2 border border-gray-300 rounded"
        value={filter}
        onChange={(e) => setFilter(e.target.value)} // Update filter state
      />

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Service Name</th>
            <th className="border border-gray-300 p-2">Price</th>
            <th className="border border-gray-300 p-2">Category</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredServices.map((service) => (
            <tr key={service.id} className="text-center">
              <td className="border border-gray-300 p-2">{service.service}</td>
              <td className="border border-gray-300 p-2">{service.price}</td>
              <td className="border border-gray-300 p-2">
                {categories.find((cat) => cat.id === service.categoryId)?.name || "Unknown"}
              </td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => onEdit(service)}
                  className="text-blue-500 hover:underline mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
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
    </div>
  );
};

export default ServicesPage;
