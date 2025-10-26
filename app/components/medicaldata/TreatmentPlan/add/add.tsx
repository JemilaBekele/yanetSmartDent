"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
type Service = {
  id: string;
  service: string;
  price: number;
};

type Category = {
  id: string;
  name: string;
};
type ServiceResponse = {
  _id: string;
  service: string;
  price: number;
};
interface CategoryResponse {
  _id: string;
  name: string;
}

type PrescriptionFormProps = {
  params: {
    id: string; // Patient ID
  };
};

const TreatmentPlanForm = ({ params }: PrescriptionFormProps) => {
  const patientId = params.id;
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
 
  const [treatmentPlanInputs, setTreatmentPlanInputs] = useState<
    { categoryId: string; serviceId: string; description: string }[]
  >([{ categoryId: "", serviceId: "", description: "" }]);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<CategoryResponse[]>("/api/Category");
    const normalizedCategories = response.data.map((cat) => ({
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

  // Fetch services based on the selected category
  const fetchServices = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/Invoice/Service/${categoryId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      const services = await response.json();
      if (!Array.isArray(services)) {
        throw new Error("Unexpected response format for services");
      }
      const typedServices = services.map((service: ServiceResponse) => ({
        id: service._id,
        service: service.service,
        price: service.price,
      }));
      setServices(typedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // Handle changes in treatment plan inputs
  const handleInputChange = (
    index: number,
    field: "categoryId" | "serviceId" | "description",
    value: string
  ) => {
    const updatedInputs = [...treatmentPlanInputs];
    updatedInputs[index][field] = value;

    if (field === "categoryId") {
      fetchServices(value);
    }

    setTreatmentPlanInputs(updatedInputs);
  };

  // Add a new empty service row
  const handleAddNewRow = () => {
    setTreatmentPlanInputs((prev) => [
      ...prev,
      { categoryId: "", serviceId: "", description: "" },
    ]);
  };

  // Delete a specific row
  const handleDeleteRow = (index: number) => {
    setTreatmentPlanInputs((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit treatment plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (treatmentPlanInputs.length === 0) {
      setFormMessage("Please add at least one service to the treatment plan.");
      return;
    }

    const plan = treatmentPlanInputs.map((input) => {
      const service = services.find((s) => s.id === input.serviceId);
      return {
        categoryId: input.categoryId,
        serviceId: input.serviceId,
        serviceName: service?.service || "",
        description: input.description,
        price: service?.price || 0,
      };
    });

    try {
      const response = await axios.post(`/api/treatmentplan/${patientId}`, {
        services: plan.map(({ serviceId, description }) => ({
          serviceId,
          description,
        })),
        totalCost: plan.reduce((total, service) => total + service.price, 0),
      });

      if (response.status === 200 || response.status === 201) {
        setFormMessage("Treatment Plan created successfully!");
        router.push(`/doctor/TreatmentPlan/all/${patientId}`);
        setTreatmentPlanInputs([{ categoryId: "", serviceId: "", description: "" }]);
      } else {
        setFormMessage("Failed to create Treatment Plan.");
      }
    } catch (error) {
      console.error("Error submitting treatment plan:", error);
      setFormMessage("An error occurred while submitting the treatment plan.");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Treatment Plan Form */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Create Treatment Plan</h2>

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
              {treatmentPlanInputs.map((input, index) => (
                <div key={index} className="space-y-4">
                  {/* Select Category */}
                  <div>
                    <label
                      htmlFor={`category-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Category
                    </label>
                    <select
                      id={`category-${index}`}
                      value={input.categoryId}
                      onChange={(e) =>
                        handleInputChange(index, "categoryId", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                  </div>

                  {/* Select Service */}
                  <div>
                    <label
                      htmlFor={`service-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Service
                    </label>
                    <select
                      id={`service-${index}`}
                      value={input.serviceId}
                      onChange={(e) =>
                        handleInputChange(index, "serviceId", e.target.value)
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.service} - {service.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Description */}
                  <div>
  <label
    htmlFor={`description-${index}`}
    className="block text-sm font-medium text-gray-700"
  >
    Description
  </label>
  <textarea
    id={`description-${index}`}
    value={input.description}
    onChange={(e) => handleInputChange(index, "description", e.target.value)}
    rows={Math.max(3, Math.ceil(input.description.length / 100))} // Adjust rows based on content length
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
    placeholder="Write about the treatment plan for this service."
  ></textarea>
</div>


                  {/* Delete Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      className=" text-red-400
                       px-4 py-2 rounded-md hover:bg-red-600"
                    >
                       <DeleteOutlined/>
                    </button>
                  </div>
                </div>
              ))}
<div className="flex justify-between items-center mb-4">
<button
                type="button"
                onClick={handleAddNewRow}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                + Add Service
              </button>

              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mt-4"
              >
                Submit
              </button></div>
            </form>

            {formMessage && (
              <p className="mt-4 bg-green-100 text-green-600 p-2 rounded-md">{formMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlanForm;
