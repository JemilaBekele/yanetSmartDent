"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined } from "@ant-design/icons";

type Service = {
  id: string;
  service: string;
  price: number;
};

type Category = {
  id: string;
  name: string;
};

type TreatmentServiceInput = {
  categoryId: string;
  serviceId: string;
  description: string;
  serviceName?: string; // Added serviceName to track selected service
};

type EditTreatmentPlanProps = {
  params: {
    patientId: string;
    treatmentPlanId: string;
  };
};

const EditTreatmentPlanPage = ({ params }: EditTreatmentPlanProps) => {
  const { patientId, treatmentPlanId } = params;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [treatmentPlanInputs, setTreatmentPlanInputs] = useState<TreatmentServiceInput[]>([]);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  // Fetch initial data for editing
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch categories
        const categoryResponse = await axios.get("/api/Category");
        const normalizedCategories = categoryResponse.data.map((cat: { _id: string; name: string }) => ({
          id: cat._id,
          name: cat.name,
        }));
        setCategories(normalizedCategories);

        // Fetch existing treatment plan
        const treatmentPlanResponse = await axios.get(`/api/treatmentplan/detail/${treatmentPlanId}`);
        if (treatmentPlanResponse.data.success) {
          const { services } = treatmentPlanResponse.data.data;
          const initialInputs = services.map((service:
            { _id?
              : string; 
              serviceId: {
                _id: string;
                categoryId?: { _id: string };
                service: string;
              };
              categoryId?:
              string;
              
              service:string;
              description:string;
              serviceName: string;

          }
            ) => ({
            categoryId: service.serviceId?.categoryId?._id || "",
            serviceId: service.serviceId?._id || "",
            description: service.description || "",
            serviceName: service.serviceId?.service || "", // Populate serviceName
          }));
          setTreatmentPlanInputs(initialInputs);
        } else {
          setFormMessage("Failed to fetch treatment plan.");
        }
      } catch (error) {
        console.error("Error fetching data for editing:", error);
        setFormMessage("An error occurred while loading the treatment plan.");
      }
    }

    fetchData();
  }, [treatmentPlanId]);

  // Fetch services based on category
  const fetchServices = async (categoryId: string) => {
    try {
      const response = await axios.get(`/api/Invoice/Service/${categoryId}`);
      setServices(
        response.data.map((service: { _id: string; 
          service:
          string
        ;
        price: string
      }

        ) => ({
          id: service._id,
          service: service.service,
          price: service.price,
        }))
      );
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // Handle input changes
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

    if (field === "serviceId") {
      const selectedService = services.find((s) => s.id === value);
      updatedInputs[index].serviceName = selectedService?.service || ""; // Update serviceName
    }

    setTreatmentPlanInputs(updatedInputs);
  };

  // Add a new row
  const handleAddNewRow = () => {
    setTreatmentPlanInputs((prev) => [
      ...prev,
      { categoryId: "", serviceId: "", description: "" },
    ]);
  };

  // Delete a row
  const handleDeleteRow = (index: number) => {
    setTreatmentPlanInputs((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit edited treatment plan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (treatmentPlanInputs.length === 0) {
      setFormMessage("Please add at least one service to the treatment plan.");
      return;
    }

    const plan = treatmentPlanInputs.map((input) => ({
      categoryId: input.categoryId,
      serviceId: input.serviceId,
      description: input.description,
    }));

    try {
      const response = await axios.patch(`/api/treatmentplan/detail/${treatmentPlanId}`, {
        services: plan,
        patientId,
      });

      if (response.data.success) {
        setFormMessage("Treatment plan updated successfully!");
        router.push(`/doctor/TreatmentPlan/all/${patientId}`);
      } else {
        setFormMessage("Failed to update treatment plan.");
      }
    } catch (error) {
      console.error("Error submitting edited treatment plan:", error);
      setFormMessage("An error occurred while updating the treatment plan.");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={{ id: patientId }} />
          </div>

          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md ml-4">
            <h2 className="text-2xl font-semibold mb-6">Edit Treatment Plan</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {treatmentPlanInputs.map((input, index) => (
                <div key={index} className="space-y-4">
                  {/* Select Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={input.categoryId}
                      onChange={(e) => handleInputChange(index, "categoryId", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <label className="block text-sm font-medium text-gray-700">Service</label>
                    <select
                      value={input.serviceId}
                      onChange={(e) => handleInputChange(index, "serviceId", e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="" disabled>
                        Select a service
                      </option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.service} - ${service.price}
                        </option>
                      ))}
                    </select>
                    {input.serviceName && <p className="mt-2 text-gray-500">Selected: {input.serviceName}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={input.description}
                      onChange={(e) => handleInputChange(index, "description", e.target.value)}
                      rows={Math.max(3, Math.ceil(input.description.length / 100))} 
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

            {formMessage && <p className="mt-4 text-green-500">{formMessage}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTreatmentPlanPage;
