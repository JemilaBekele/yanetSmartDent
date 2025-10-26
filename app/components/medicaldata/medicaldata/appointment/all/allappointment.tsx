"use client";
import React, { useState, useEffect , useMemo } from "react";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";
import Link from "next/link";
import EditAppointmentModal from "@/app/components/patient/EditappointmentModal";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from 'next-auth/react';
// Align the types for consistency
type AppointmentData = {
  _id: string;
  appointmentDate: string; // Full date-time string
  appointmentTime: string;
  appointmentEndTime: string; // New field for end time
  reasonForVisit: string;
  status: string;
  doctorId: { id: string; username: string };
  patientId: { id: string };
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { username: string };
};

type AppointmentListProps = {
  params: {
    id: string;
  };
};

export default function AppointmentList({ params }: AppointmentListProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const role = useMemo(() => session?.user?.role || '', [session]);

  const convertTo12HourFormat = (time24: string) => {
    const [hours, minutes] = time24.split(":").map(Number);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12; // Convert 0 hour to 12 for 12 AM/PM
    return `${hours12}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
  };
  // Fetch appointments from the backend
  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch(`/api/patient/Appointment/${patientId}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        if (result.success) {
          setAppointments(result.data);
        } else {
          console.error("No data found:", result.message);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    }

    fetchAppointments();
  }, [patientId]);

  const handleEdit = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
    setIsEditOpen(true);
  };


 
  const handleDelete = async (appointmentId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment? This action cannot be undone."
    );
  
    if (!confirmDelete) {
      return; // Exit if the user cancels the action
    }
  
    const toastId = toast.loading("Deleting appointment...");
  
    try {
      const response = await axios.delete(`/api/patient/Appointment/detail/${appointmentId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: { appointmentId }, // Send appointmentId in the request body
      });
  
      if (response.data.success) {
        setAppointments((prevAppointments) =>
          prevAppointments.filter((appt) => appt._id !== appointmentId)
        );
        toast.update(toastId, {
          render: "Appointment deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: response.data.error || "Failed to delete appointment.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        console.error("Failed to delete the appointment:", response.data.error);
      }
    } catch (error) {
      toast.update(toastId, {
        render: "An unexpected error occurred while deleting the appointment.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error deleting appointment:", error);
    }
  };
  
   
 
   
 
  
  

  const handleUpdate = async (data: AppointmentData) => {
    if (!data._id) return; // Ensure the data has an ID to update

    try {
      const payload = { appointmentId: data._id, ...data };

      const response = await axios.patch(`/api/patient/Appointment/detail/${data._id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setAppointments((prevAppointments) =>
          prevAppointments.map((appt) => (appt._id === data._id ? response.data.data : appt))
        );
        console.log("Appointment updated successfully");
      } else {
        console.error("Failed to update the appointment:", response.data.error);
      }
    } catch (err) {
      console.error("Error updating appointment:", err);
    } finally {
      handleCloseModal(); // Close modal after update
    }
  };

  const handleCloseModal = () => {
    setIsEditOpen(false);
    setSelectedAppointment(null);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-200 text-blue-800"; 
      case "Completed":
        return "bg-green-200 text-green-800"; 
      case "Cancelled":
        return "bg-red-200 text-red-800"; 
      case "Pending":
        return "bg-yellow-200 text-yellow-800"; 
      default:
        return "bg-gray-200 text-gray-800"; 
    }
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
              <h1 className="text-2xl font-bold">Appointments</h1>
              {role === 'reception' && (
                <>
              <Link
                href={`/reception/appointment/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Appointment +
              </Link></>
              )}
               {role === 'nurse' && (
                <>
              <Link
                href={`/nurse/appointment/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Appointment +
              </Link></>
              )}
              {role === 'admin' && (
                <>
                 <Link
                href={`/admin/medicaldata/appointment/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Appointment +
              </Link>
                </>
              )}
              {role === 'doctor' && (
                <>
              <Link
                href={`/doctor/medicaldata/appointment/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Appointment +
              </Link></>
              )}
            
            </div>

            {appointments.length === 0 ? (
              <p className="text-gray-500">No appointments available.</p>
            ) : (
              <table className="min-w-full bg-white rounded-lg">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Time</th>
                    <th className="px-4 py-2 border">End Time</th>
                    <th className="px-4 py-2 border">Reason for Visit</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Doctor</th>
                    <th className="px-4 py-2 border">Created At</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="border-t">
                    <td className="px-4 py-2 border">
  {appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : " "}
</td>
<td className="px-4 py-2 border">
  {appointment.appointmentTime ? convertTo12HourFormat(appointment.appointmentTime) : " "}
</td>
<td className="px-4 py-2 border">
  {appointment.appointmentEndTime ? convertTo12HourFormat(appointment.appointmentEndTime) : " "}
</td>

                      <td className="px-4 py-2 border">{appointment.reasonForVisit || "N/A"}</td>
                      <td className="px-4 py-2 border">
                        <span className={`px-2 py-1 rounded-full ${getStatusClass(appointment?.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 border">{appointment?.doctorId.username}</td>
                      <td className="px-4 py-2 border">  {new Date(appointment.createdAt || "").toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}</td>
                      <td className="px-4 py-2 border">
                     
                        <div className="flex space-x-2">
                          <button
                            className="hover:bg-blue-300 p-2 rounded-full"
                            onClick={() => handleEdit(appointment)}
                            aria-label="Edit appointment"
                            title="Edit appointment"
                          >
                            <EditOutlined className="text-xl text-blue-500" />
                          </button>
                          <button
                            className="hover:bg-red-300 p-2 rounded-full"
                            onClick={() => handleDelete(appointment._id)}
                            aria-label="Delete appointment"
                            title="Delete appointment"
                          >
                            <DeleteOutlined className="text-xl text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <EditAppointmentModal
          isOpen={isEditOpen}
          formData={selectedAppointment}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
        <ToastContainer />
      </div>
    </div>
  );
}
