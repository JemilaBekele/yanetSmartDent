"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type FormData = {
  cardno: string;
  firstname: string;
  age: string;
  sex: string;
  Town: string;
  KK: string;
  HNo: string;
  phoneNumber: string;
  description: string;
  credit: boolean;
  Region: string;
  Woreda: string;
  disablity: boolean;
  Locked: boolean;
};

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const UpdatePatientForm: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId: string = params.id;
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    cardno: "",
    firstname: "",
    age: "",
    phoneNumber: "",
    sex: "",
    Town: "",
    KK: "",
    HNo: "",
    description: "",
    Region:'',
    Woreda:'',
    disablity: false,
    Locked: false,
    credit: false,
  });
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await fetch(`/api/patient/registerdata/${patientId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setFormData(data);
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    };

    fetchPatientData();
  }, [patientId]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type, value } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/patient/registerdata/${patientId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("Patient updated successfully");
        router.push(`/reception/card/all/${patientId}`);
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error updating patient:", error);
      setMessage("Internal server error");
    }
  };

  const handleCancel = () => {
    router.push(`/reception/card/all/${patientId}`);
  };

  const handleDeleteConfirmation = (recordId: string) => {
    if (!recordId) {
      console.error("No credit ID provided for deletion");
      return;
    }
    toast.warn(
      <div>
        <span>Are you sure you want to delete this Health Information?</span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "10px",
          }}
        >
          <button onClick={() => handleDelete(recordId)}>Yes</button>
          <button onClick={() => toast.dismiss()}>No</button>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDelete = async (recordId: string) => {
    try {
      await axios.delete(`/api/patient/registerdata/${recordId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      router.push("/reception");
      toast.success("Health Information deleted successfully!");
    } catch (err) {
      console.error("Error deleting user:", err);
      setMessage("Error deleting user.");
    } finally {
      toast.dismiss();
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
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Update Patient
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: "Card Number", name: "cardno", type: "text" },
                  {
                    label: "First Name",
                    name: "firstname",
                    type: "text",
                    minLength: 3,
                    maxLength: 50,
                  },
                  { label: "Town", name: "Town", type: "text", maxLength: 50 },
                  { label: "House No", name: "HNo", type: "text", maxLength: 50 },
                  { label: "KK", name: "KK", type: "text", maxLength: 50 },
                  { label: "Region", name: "Region", type: "text", maxLength: 50 },
                  { label: "Woreda", name: "Woreda", type: "text", maxLength: 50 },
              
                
                  { label: "Age", name: "age", type: "number" },
                  {
                    label: "Phone Number",
                    name: "phoneNumber",
                    type: "tel",
                  },
                  
                ].map(({ label, name, type, minLength, maxLength }) => (
                  <div key={name} className="col-span-1">
                    <label
                      htmlFor={name}
                      className="block text-sm font-medium text-gray-700"
                    >
                      {label}
                    </label>
                    <input
                      id={name}
                      name={name}
                      type={type}
                      value={typeof formData[name as keyof FormData] === 'boolean' ? (formData[name as keyof FormData] ? 'true' : 'false') : formData[name as keyof FormData] as string | number | readonly string[] | undefined}

                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      minLength={minLength}
                      maxLength={maxLength}
                    />
                  </div>
                ))}

                <div className="col-span-1 sm:col-span-2">
                  <label
                    htmlFor="sex"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Sex
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    required
                  >
                    <option value="">Select sex</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 flex items-center">
  <input
    id="credit"
    name="credit"
    type="checkbox"
    checked={formData.credit}
    onChange={handleChange}
    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
  />
  <label
    htmlFor="credit"
    className="ml-2 block text-sm font-medium text-gray-700"
  >
    Use Credit
  </label>
</div>


<div className="col-span-1 sm:col-span-2 flex items-center">
  <input
    id="Locked"
    name="Locked"
    type="checkbox"
    checked={formData.Locked}
    onChange={handleChange}
    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
  />
  <label
    htmlFor="Locked"
    className="ml-2 block text-sm font-medium text-gray-700"
  >
    Locked
  </label>
</div>


<div className="col-span-1 sm:col-span-2 flex items-center">
  <input
    id="disablity"
    name="disablity"
    type="checkbox"
    checked={formData.disablity}
    onChange={handleChange}
    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
  />
  <label
    htmlFor="disablity"
    className="ml-2 block text-sm font-medium text-gray-700"
  >
    Disability
  </label>
</div>

              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Update
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full py-2 px-4 bg-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                >
                  Cancel
                </button>

                <DeleteOutlined
                  className="text-2xl bg-red-300 p-3 text-red-500 group-hover:text-white"
                  onClick={() => handleDeleteConfirmation(patientId)}
                />
              </div>

              {message && (
                <p className="mt-4 text-center bg-green-300 text-green-400">
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default UpdatePatientForm;