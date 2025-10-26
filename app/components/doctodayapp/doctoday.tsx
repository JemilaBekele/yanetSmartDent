"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCaption, TableHead, TableHeader, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { CodeOutlined } from '@ant-design/icons';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  doctorId: { username: string };
  status: string;
  patientId: {
    id: { _id: string ;
      firstname: string;
      cardno: string;};
    username: string;
    cardno: string;
  };
}

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);

  const router = useRouter(); // For programmatic navigation

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        const response = await fetch('/api/app/todaydoc'); // Adjust the API endpoint as needed
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const data = await response.json();
        if (data.success) {
          setAppointments(data.data); // Set the fetched appointments
        } else {
          setError(data.message || 'Unknown error occurred');
        }
      } catch (err) {
        setError('Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
  }, []);

  if (loading) {
    return <div>Loading appointments...</div>;
  }

  if (error) {
    return <div className="text-center bg-green text-gray-500">{error}</div>;
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const handleViewMedicalHistory = (patientId: string | undefined) => {
    if (patientId) {
      router.push(`/doctor/medicaldata/medicalhistory/all/${patientId}`);
    } else {
      console.error('Invalid patient ID');
    }
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

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const totalPages = Math.ceil(appointments.length / pageSize);

  return (
   <>
      <h1 className="text-2xl font-bold mb-6 text-center">Today Appointments</h1>
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
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>
                {new Date(appointment.appointmentDate).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </TableCell>
              <TableCell>{formatTime(appointment.appointmentTime)}</TableCell>
              <TableCell>{appointment.patientId.id.firstname}</TableCell>
                  <TableCell>{appointment.patientId.id.cardno}</TableCell>
              <TableCell>
                <p className={`flex items-center justify-center px-1 py-1 rounded-full ${getStatusClass(appointment.status)}`}>
                  {appointment.status}
                </p>
              </TableCell>
              <TableCell>{appointment.doctorId.username}</TableCell>
              <TableCell>
                <button
                  onClick={() => handleViewMedicalHistory(appointment.patientId?.id._id)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-600"
                  aria-label="MedicalHistory"
                >
                  <CodeOutlined />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-2 mt-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(0)}
            disabled={pageIndex === 0}
          >
            <DoubleLeftOutlined className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            <LeftOutlined className="h-4 w-4" />
          </Button>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => handlePageChange(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            <RightOutlined className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handlePageChange(totalPages - 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            <DoubleRightOutlined className="h-4 w-4" />
          </Button>
        </div>
      </div>
      </>
  );
};

export default Appointments;