'use client';

import React, { useEffect, useState,useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableCaption, TableHead, TableHeader, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { CodeOutlined } from '@ant-design/icons';
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { useSession } from "next-auth/react";


import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PatientRecord {
  id: {
    _id: string;
    firstname: string;
    cardno: string;
    age: string;
    phoneNumber: string;
    sex: string;
  };
}

const UnconfirmedCredits: React.FC = () => {
  const { data: session } = useSession();
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const role = useMemo(() => session?.user?.role || "", [session]);
  const router = useRouter(); // For programmatic navigation

  useEffect(() => {
    const fetchUnconfirmedCredits = async () => {
      try {
        const response = await fetch('/api/Creadit/unconfirmed'); // Adjust the API endpoint as needed
        if (!response.ok) {
          throw new Error('Failed to fetch unconfirmed credits');
        }
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          setPatients(data.data); // Set the fetched patient data
        } else {
          setPatients([]); // No data available
        }
      } catch (err) {
        setError('Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUnconfirmedCredits();
  }, []);

  if (loading) {
    return <div>Loading patient data...</div>;
  }

  if (error) {
    return <div className="text-center bg-green text-gray-500">{error}</div>;
  }



  const handleViewPatientDetails = (patientId: string | undefined) => {
    if (patientId) {
      router.push(role === 'admin' ?`/admin/organization/all/${patientId}`: `/reception/organization/all/${patientId}`);
    } else {
      console.error('Invalid patient ID');
    }
  };

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const totalPages = Math.ceil(patients.length / pageSize);

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Unconfirmed Credits Patients</h1>
      <button
        type="submit"
        className="ml-4 mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => router.push(role === 'admin' ?`/admin/creadit/report`: `/reception/creadit/report`)}
      >
        Report of unpaid Credit
      </button>
      <button
        type="submit"
        className="ml-4 mb-8 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={() => router.push(role === 'admin' ?`/admin/creadit/confirm`: `/reception/creadit/confirm`)}
      >
        Report of paid Credit
      </button>
      <Table>
        <TableCaption>A list of patients with unconfirmed credit records.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Card No</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map((patient) => (
            <TableRow key={patient.id._id}>
              <TableCell>{patient.id.firstname}</TableCell>
              <TableCell>{patient.id.cardno}</TableCell>
              <TableCell>{patient.id.age}</TableCell>
              <TableCell>{patient.id.phoneNumber}</TableCell>
              <TableCell>{patient.id.sex}</TableCell>
              <TableCell>
                <button
                  onClick={() => handleViewPatientDetails(patient.id._id)}
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-600"
                  aria-label="View Patient Details"
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
    </div>
  );
};

export default UnconfirmedCredits;