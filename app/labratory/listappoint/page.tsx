"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { ro } from "date-fns/locale";
import { useSession } from "next-auth/react";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string | null;
  reasonForVisit: string;
  doctorId: { id: string; username: string };
  status: string;
  patientId: {
    id: {
      _id: string;
      firstname: string;
      phoneNumber: string;
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
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const router = useRouter();
    const { data: session } = useSession();

  const role = useMemo(() => session?.user?.role || '', [session]);



  const fetchAppointmentsByDate = async (date: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/app/listappoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: date }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch filtered appointments");
      }
      const data = await response.json();
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

  // Format date as "MM/DD/YYYY"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Format time as "HH:MM AM/PM"
  const formatTime = (time: string | null) => {
    if (!time || typeof time !== "string" || !time.includes(":")) {
      return "-"; // Return a fallback value for invalid or null time
    }

    const [hours, minutesPart] = time.split(":");
    if (!hours || !minutesPart) {
      return "-"; // Handle invalid time format
    }

    const hour = parseInt(hours);
    if (isNaN(hour)) {
      return "-"; // Handle invalid hours
    }

    const minutes = minutesPart.split(" ")[0]; // Extract minutes before AM/PM
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes.padStart(2, "0")} ${ampm}`;
  };

  // Convert time to 24-hour format for sorting
  const timeTo24Hour = (time: string | null) => {
    if (!time || typeof time !== "string") {
      return 0; // Return a default value for invalid or null time
    }

    const [hours, minutesPart] = time.split(":");
    if (!hours || !minutesPart) {
      return 0; // Handle invalid time format
    }

    let hourNum = parseInt(hours);
    let [minutes, ampm] = minutesPart.includes("AM") || minutesPart.includes("PM")
      ? minutesPart.split(" ")
      : [minutesPart, ""];

    if (isNaN(hourNum)) {
      return 0; // Handle invalid hours
    }

    if (ampm === "PM" && hourNum !== 12) hourNum += 12;
    if (ampm === "AM" && hourNum === 12) hourNum = 0;

    const minuteNum = parseInt(minutes.split(":")[0]) || 0;
    return hourNum * 60 + minuteNum;
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

  const uniqueDoctors = Array.from(
    new Map(appointments.map((appt) => [appt.doctorId.id, appt.doctorId])).values()
  );

  // Sort appointments by time
  const filteredAppointments = selectedDoctor
    ? appointments.filter((appt) => appt.doctorId.id === selectedDoctor)
    : appointments;

  // Sort by appointmentTime in ascending order
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    return timeTo24Hour(a.appointmentTime) - timeTo24Hour(b.appointmentTime);
  });
const handleViewDetails = (id: string) => {
  router.push(`/${role}/card/all/${id}`);
};

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Appointments</h1>

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
        type="button"
        className="ml-4 mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => router.push(`/${role}/listappoint/all`)}
      >
        All Appointments
      </button>

      <div className="mb-6 text-center">
        <h2 className="text-lg font-bold mb-2">Filter by Doctor</h2>
        <select
          value={selectedDoctor || ""}
          onChange={(e) => setSelectedDoctor(e.target.value || null)}
          className="px-4 py-2 border rounded w-1/3"
        >
          <option value="">All Doctors</option>
          {uniqueDoctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.username}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div>Loading appointments...</div>
      ) : error ? (
        <div className="text-center bg-red-100 text-red-500">{error}</div>
      ) : sortedAppointments.length > 0 ? (
        <Table>
          <TableCaption>Filtered Appointments</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Appointment Date</TableHead>
              <TableHead>Appointment Time</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Card No</TableHead>
              <TableHead>Reason for Visit</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAppointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>{formatDate(appointment.appointmentDate)}</TableCell>
                <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
                <TableCell>{appointment.patientId.id.firstname}</TableCell>
                <TableCell>{appointment.patientId.id.phoneNumber}</TableCell>
                <TableCell>{appointment.patientId.id.cardno}</TableCell>
                <TableCell>{appointment.reasonForVisit || "-"}</TableCell>
                <TableCell>{appointment.reasonForVisit || "-"}</TableCell>

                <TableCell>
                  <span className={`px-2 py-1 rounded-full ${getStatusClass(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </TableCell>
                <TableCell>{appointment.doctorId.username}</TableCell>
                <TableCell>
  <button
    onClick={() => handleViewDetails(appointment.patientId.id._id)}
    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-800"
  >
    View Details
  </button>
</TableCell>
 
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center text-gray-500">No appointments found.</div>
      )}
    </div>
  );
};

export default TodayAppointments;