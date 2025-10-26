"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useSession } from 'next-auth/react';

type AppointmentFormProps = {
  params: {
    id: string;
  };
};

type Doctor = {
  _id: string;
  username: string;
};

type ConflictAppointment = {
  id: string;
  time: string;
  endTime: string;
};

export default function AppointmentForm({ params }: AppointmentFormProps) {
  const { data: session } = useSession(); 
  const patientId = params.id;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    appointmentDate: "",
    appointmentTime: "",
    appointmentEndTime: "",
    reasonForVisit: "",
    doctorId: "", 
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [conflictingAppointments, setConflictingAppointments] = useState<ConflictAppointment[]>([]);
  const role = useMemo(() => session?.user?.role || '', [session]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch(`/api/Doctor`);
        const data = await response.json();
        if (response.ok) {
          setDoctors(data);
        } else {
          setError("Failed to fetch doctors");
        }
      } catch (err) {
        setError("An error occurred while fetching doctors");
      }
    };

    fetchDoctors();
  }, []);

  // Clear conflict error when form data changes
  useEffect(() => {
    if (conflictError) {
      setConflictError(null);
      setConflictingAppointments([]);
    }
  }, [formData.appointmentDate, formData.appointmentTime, formData.appointmentEndTime, formData.doctorId]);

  // Validate form data
  const validateForm = () => {
    const formErrors: { [key: string]: string } = {};

    if (!formData.appointmentDate) {
      formErrors.appointmentDate = "Appointment date is required";
    }

    if (!formData.appointmentTime) {
      formErrors.appointmentTime = "Appointment time is required";
    }

    if (!formData.appointmentEndTime) {
      formErrors.appointmentEndTime = "Appointment end time is required";
    }

    if (formData.appointmentTime && formData.appointmentEndTime) {
      const startTime = new Date(`2000-01-01T${formData.appointmentTime}`);
      const endTime = new Date(`2000-01-01T${formData.appointmentEndTime}`);
    
    }

    if (!formData.doctorId) {
      formErrors.doctorId = "Please select a doctor";
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    setConflictingAppointments([]);

    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch(`/api/patient/Appointment/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Handle appointment conflict error
          setConflictError(result.error || "Appointment time conflict");
          if (result.conflictingAppointments) {
            setConflictingAppointments(result.conflictingAppointments);
          }
        } else {
          setError(result.error || "Failed to create appointment");
        }
      } else {
        console.log("Appointment created successfully");
        setFormSubmitted(true);
        router.push(`/${role}/medicaldata/appointment/all/${patientId}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("An error occurred while creating the appointment");
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle doctor selection
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setFormData({ ...formData, doctorId: selectedId });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
              <h1 className="text-2xl font-bold">Create New Appointment</h1>
            </div>

            {/* Global Error Display */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Conflict Error Display */}
            {conflictError && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                <div className="font-bold">{conflictError}</div>
                {conflictingAppointments.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold">Conflicting appointments:</p>
                    <ul className="list-disc list-inside mt-1">
                      {conflictingAppointments.map((apt, index) => (
                        <li key={index}>
                          {formatTime(apt.time)} - {formatTime(apt.endTime)}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm">
                      Please choose a different time with at least 20 minutes gap before and after existing appointments.
                    </p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="appointmentDate" className="block font-bold mb-2">
                  Appointment Date
                </label>
                <input
                  id="appointmentDate"
                  name="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.appointmentDate ? "border-red-500" : ""}`}
                />
                {errors.appointmentDate && <p className="text-red-500">{errors.appointmentDate}</p>}
              </div>

              <div className="mt-4">
                <label htmlFor="appointmentTime" className="block font-bold mb-2">
                  Appointment Start Time
                </label>
                <input
                  id="appointmentTime"
                  name="appointmentTime"
                  type="time"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.appointmentTime ? "border-red-500" : ""}`}
                />
                {errors.appointmentTime && <p className="text-red-500">{errors.appointmentTime}</p>}
              </div>

              <div className="mt-4">
                <label htmlFor="appointmentEndTime" className="block font-bold mb-2">
                  Appointment End Time
                </label>
                <input
                  id="appointmentEndTime"
                  name="appointmentEndTime"
                  type="time"
                  value={formData.appointmentEndTime}
                  onChange={handleInputChange}
                  className={`border p-2 rounded-md w-full ${errors.appointmentEndTime ? "border-red-500" : ""}`}
                />
                {errors.appointmentEndTime && <p className="text-red-500">{errors.appointmentEndTime}</p>}
              </div>

              <div className="mt-4">
                <label htmlFor="reasonForVisit" className="block font-bold mb-2">
                  Reason for Visit
                </label>
                <textarea
                  id="reasonForVisit"
                  name="reasonForVisit"
                  value={formData.reasonForVisit}
                  onChange={handleInputChange}
                  className="border p-2 rounded-md w-full"
                  rows={3}
                />
              </div>

              <div className="mt-4">
                <label htmlFor="doctorId" className="block font-bold mb-2">
                  Select Doctor
                </label>
                <select
                  id="doctorId"
                  name="doctorId"
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                  className={`border p-2 rounded-md w-full ${errors.doctorId ? "border-red-500" : ""}`}
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.username}
                    </option>
                  ))}
                </select>
                {errors.doctorId && <p className="text-red-500">{errors.doctorId}</p>}
              </div>

              <button 
                type="submit" 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md mt-4 transition duration-200"
              >
                Create Appointment
              </button>
            </form>

            {formSubmitted && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
                Appointment created successfully!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}