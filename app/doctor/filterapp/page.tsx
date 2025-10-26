"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Appointments from '@/app/components/doctodayapp/doctoday'
import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentEndTime: string;
  doctorId: { username: string };
  status: string;
  patientId: {
    id: {
      _id: string;
      firstname: string;
      cardno: string;
    };
    username: string;
    cardno: string;
  };
}

const TodayAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const router = useRouter();

  const fetchAppointmentsByDate = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/app/listdocapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: date }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch filtered appointments");
      }
      const data = await response.json();
      console.log("Response Data:", data);
      if (data.success) {
        setAppointments(data.data);
      } else {
        setError(data.message || "Unknown error occurred");
      }
    } catch (err) {
      setError("Error fetching appointments.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDate) {
      fetchAppointmentsByDate(selectedDate);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
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
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Appointments</h1>
      <Appointments />

      <form onSubmit={handleSubmit} className="mb-4 text-center">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)} 
          className="px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        >
          Filter
        </button>
      </form>
      <button
        type="submit"
        className="ml-4 mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => router.push(`/doctor/allappointment`)}
      >
        All Appointments
      </button>

      {loading ? (
        <div>Loading appointments...</div>
      ) : error ? (
        <div className="text-center bg-red-100 text-red-500">{error}</div>
      ) : (
        <Table>
          <TableCaption>A list of patients with Scheduled Appointments.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Appointment Date</TableHead>
              <TableHead>Appointment Time</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Card No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <TableRow key={appointment.id} onClick={() => router.push(`/doctor/medicaldata/appointment/all/${appointment.patientId?.id._id}`)}>
                  <TableCell>
                    {new Date(appointment.appointmentDate).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )}
                  </TableCell>
                  <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
                  <TableCell>{formatTime(appointment.appointmentEndTime)}</TableCell>
                  <TableCell>{appointment.patientId.id.firstname}</TableCell>
                  <TableCell>{appointment.patientId.id.cardno}</TableCell>
                  <TableCell>
                    <p className={`flex items-center justify-center px-1 py-1 rounded-full ${getStatusClass(appointment.status)}`}>
                      {appointment.status}
                    </p>
                  </TableCell>
                  <TableCell>{appointment.doctorId.username}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  No appointments scheduled on this date.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default TodayAppointments;