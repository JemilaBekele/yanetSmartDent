"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";

import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
type TreatmentPlan = {
  _id: string;
  services: { serviceId: { service: string; price: number }, description: string }[];
  createdBy: { id: string; username: string };
  createdAt: string;
};

type PatientData = {
  id: string;
  firstname: string;
  phoneNumber: string;
  sex: string;
  Town: string;
  KK: string;
  age: string;
  updatedAt: string;
  cardno: string;
};

type TreatmentPlanPageProps = {
  params: { id: string }; // Patient ID
};

export default function TreatmentPlanPage({ params }: TreatmentPlanPageProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const role = useMemo(() => session?.user?.role || "", [session]);
  const router = useRouter();
  // Fetch patient data and treatment plans
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/api/treatmentplan/${patientId}`);
        console.log(response.data);
        if (response.data.success) {
          const { patient, TreatmentPlans } = response.data.data;
          setPatientData(patient);
          setTreatmentPlans(TreatmentPlans);
        } else {
          toast.error("Failed to fetch treatment plans.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [patientId]);


  
  
  
  // Handle Delete
  const handleDelete = async (treatmentPlanId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this treatment plan?");
    if (!confirmDelete) return;
    try {
      const response = await axios.delete(`/api/treatmentplan/detail/${treatmentPlanId}`);
      if (response.data.success) {
        setTreatmentPlans((prev) => prev.filter((plan) => plan._id !== treatmentPlanId));
        toast.success("Treatment plan deleted successfully!");
      } else {
        toast.error("Failed to delete treatment plan.");
      }
    } catch (error) {
      console.error("Error deleting treatment plan:", error);
      toast.error("An error occurred while deleting the treatment plan.");
    }
  };

  const handleEdit = (patientId: string, treatmentPlanId: string) => {
    router.push(`/doctor/TreatmentPlan/edit?treatmentPlanId=${treatmentPlanId}&patientId=${patientId}`);
  };
  

  

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold mb-4">Treatment Plans</h1>
            {role === "admin" && (
                  <Link
                  href={`/admin/TreatmentPlan/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Treatment Plans +
                </Link>
              )}
              {role === "doctor" && (
                 <Link
                 href={`/doctor/TreatmentPlan/add/${patientId}`}
                 className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
               >
                 New Treatment Plans +
               </Link>
              )}
          
</div>
            {isLoading ? (
              <p>Loading treatment plans...</p>
            ) : treatmentPlans.length === 0 ? (
              <p>No treatment plans available.</p>
            ) : (
              <div className="space-y-6">
  {treatmentPlans.map((plan) => (
    <div
      key={plan._id}
      className="bg-white border shadow-md rounded-lg p-6 flex justify-between items-center"
    >
      {/* Left Section: Plan Details */}
      <div>
        <p className="text-gray-800 font-semibold">
          <span className="font-bold text-gray-600">Created By:</span>{" "}
          {plan.createdBy?.username || "Unknown"}
        </p>
        <p className="text-gray-800 font-semibold">
          <span className="font-bold text-gray-600">Created At:</span>{" "}
          {new Date(plan.createdAt).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="mt-3 space-y-1">
          {plan.services.map((service, index) => (
            <p key={index} className="text-gray-700">
              <strong>Service:</strong> {service.serviceId.service} |{" "}
              <strong>Description:</strong> {service.description}
            </p>
          ))}
        </div>
      </div>

      {/* Right Section: Actions */}
      <div className="flex space-x-4">
      
        <button
          onClick={() => handleDelete(plan._id)}
          className="flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-500 rounded-full p-3 transition duration-200"
        >
          <DeleteOutlined />
        </button>
        <button
          onClick={() => handleEdit(patientId, plan._id)}
          className="flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 text-yellow-500 rounded-full p-3 transition duration-200"
        >
          <EditOutlined />
        </button>
      </div>
    </div>
  ))}
</div>

            )}
            
          </div>
        </div>
        <ToastContainer />
      </div>
    </div>
  );
}
