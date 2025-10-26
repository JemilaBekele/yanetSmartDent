"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ServicesPage from "@/app/components/admin/service";
import { Category } from "@/types/catagory";

type Service = {
  id?: string;
  service: string;
  price: number;
  categoryId: string;
};



type ApiService = {
  _id: string;
  service: string;
  price: number;
  categoryId: string | { _id: string };
};

type ApiCategory = {
  _id: string;
  name: string;
};

const ServiceForm = () => {
  const [serviceData, setServiceData] = useState<Service>({
    id: "",
    service: "",
    price: 0,
    categoryId: "",
  });

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          axios.get<ApiService[]>("/api/Invoice/Service"),
          axios.get<ApiCategory[]>("/api/Category"),
        ]);

        const normalizedServices = servicesRes.data.map((service: ApiService) => ({
          id: service._id,
          service: service.service,
          price: service.price,
          categoryId: typeof service.categoryId === "object" ? service.categoryId._id : service.categoryId,
        }));

        const normalizedCategories = categoriesRes.data.map((cat: ApiCategory) => ({
          id: cat._id,
          name: cat.name,
        }));

        setServices(normalizedServices);
        setCategories(normalizedCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setServiceData((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const endpoint = serviceData.id ? `/api/Invoice/Service/${serviceData.id}` : "/api/Invoice/Service";
    const method = serviceData.id ? "patch" : "post";

    try {
      const response = await axios[method](endpoint, serviceData);

      if (response.status === 200 || response.status === 201) {
        setMessage(serviceData.id ? "Service updated successfully!" : "Service added successfully!");
        setServiceData({ id: "", service: "", price: 0, categoryId: "" });

        const updatedService = {
          id: response.data.service._id,
          service: response.data.service.service,
          price: response.data.service.price,
          categoryId: response.data.service.categoryId,
        };

        setServices((prev) =>
          serviceData.id
            ? prev.map((s) => (s.id === serviceData.id ? updatedService : s))
            : [...prev, updatedService]
        );
      } else {
        setMessage("Failed to save service.");
      }
    } catch (error) {
      console.error("Error saving service:", error);
      setMessage("Error saving service.");
    }
  };

  const handleEdit = (service: Service) => {
    setServiceData(service);
  };

  return (
  <div className="flex flex-col lg:ml-9 mt-4 lg:mt-7 px-4 sm:px-6">
    <div className="flex-grow lg:ml-60 container mx-auto w-full">
      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-300 to-blue-500 px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {serviceData.id ? "Edit Service" : "Add New Service"}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                {serviceData.id 
                  ? "Update your service information below" 
                  : "Create a new service for your organization"
                }
              </p>
            </div>
            {serviceData.id && (
              <div className="mt-4 sm:mt-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                  Editing Mode
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        {message && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-700 font-medium">{message}</span>
          </div>
        )}

        <div className="p-6">
          {/* Form Section */}
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Name */}
              <div className="group">
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="service"
                    value={serviceData.service}
                    onChange={handleChange}
                    required
                    placeholder="Enter service name"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="group">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    value={serviceData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="block w-full pl-7 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="group">
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    name="categoryId"
                    value={serviceData.categoryId}
                    onChange={handleChange}
                    required
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 appearance-none bg-white"
                  >
                    <option value="" disabled className="text-gray-500">
                      Select a category
                    </option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id} className="text-gray-900">
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-200 transform hover:scale-105"
                >
                  {serviceData.id ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Service
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Service
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <a
                href="/admin/Category"
                className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Category Management</div>
                  <div className="text-sm text-gray-500">Manage service categories</div>
                </div>
              </a>

              <a
                href="/admin/creaditorg"
                className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Organizations Service</div>
                  <div className="text-sm text-gray-500">Manage organization services</div>
                </div>
              </a>

              <a
                href="/admin/addorg"
                className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all duration-200 group"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Add Organization</div>
                  <div className="text-sm text-gray-500">Create new organization</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Services List Section */}
      <div className="mt-6">
        <ServicesPage services={services} setServices={setServices} onEdit={handleEdit} />
      </div>
    </div>
  </div>
);
};

export default ServiceForm;
