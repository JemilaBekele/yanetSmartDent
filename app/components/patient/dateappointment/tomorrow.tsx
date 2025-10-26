"use client";

import React, { useEffect, useState } from "react";
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
  doctorId: { id: string; username: string };
  status: string;
  patientId: {
    id: {
      _id: string;
      firstname: string;
      phoneNumber: string;
    };
  };
}

const TomorrowAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTomorrowAppointments = async () => {
      try {
        const response = await fetch("/api/app/tomo"); // Adjust the API endpoint as needed
        if (!response.ok) {
          throw new Error("Failed to fetch appointments");
        }
        const data = await response.json();
        if (data.success) {
          setAppointments(data.data); // Set the fetched appointments
        } else {
          setError(data.message || "Unknown error occurred");
        }
      } catch (err) {
        setError("Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTomorrowAppointments();
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12; // Convert 24-hour to 12-hour, handling midnight as 12
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Group appointments by doctor ID (ensuring proper grouping even if username changes)
  const groupedAppointments = appointments.reduce(
    (acc: { [doctorId: string]: { username: string; appointments: Appointment[] } }, appointment) => {
      const doctorId = appointment.doctorId.id;
      if (!acc[doctorId]) {
        acc[doctorId] = { username: appointment.doctorId.username, appointments: [] };
      }
      acc[doctorId].appointments.push(appointment);
      return acc;
    },
    {}
  );

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  if (error) {
    return <div className="text-center text-gray-500">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Tomorrow&apos;s Scheduled Appointments
      </h1>

      {Object.keys(groupedAppointments).length > 0 ? (
        Object.keys(groupedAppointments).map((doctorId) => (
          <div key={doctorId} className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              {groupedAppointments[doctorId].username}
            </h2>
            <Table>
              <TableCaption>
                List of patients with appointments for {groupedAppointments[doctorId].username}.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment Date</TableHead>
                  <TableHead>Appointment Time</TableHead>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Phone Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedAppointments[doctorId].appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      {new Date(appointment.appointmentDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
                    <TableCell>{appointment.patientId.id.firstname}</TableCell>
                    <TableCell>{appointment.patientId.id.phoneNumber}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500">
          No appointments scheduled for tomorrow.
        </div>
      )}
    </div>
  );
};

export default TomorrowAppointments;
