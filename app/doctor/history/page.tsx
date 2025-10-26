"use client";
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';

type MedicalFinding = {
  ChiefCompliance: string;
  createdAt: string;
};

type Patient = {
  _id: string;
  firstname: string;
  sex: string;
  age: string;
  cardno: string;
  MedicalFinding: MedicalFinding[];
};

const Home: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patient/MedicalHistory/doc');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        console.log("Patients data:", data.data);
        if (Array.isArray(data.data) && data.data.length > 0) {
          setPatients(data.data);
        } else {
          setError('No patients found');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch data initially
    fetchPatients();

    // Set interval for refreshing data every 20 seconds
    const intervalId = setInterval(fetchPatients, 20000);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const totalPages = Math.ceil(patients.length / pageSize);

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  if (loading) {
    return <div>Loading patients...</div>;
  }

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-xl font-bold mb-5">Patients</h1>
      {error && <div className="text-gray-500">{error}</div>}
      <Table>
        <TableCaption>A list of patients with recent medical findings.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Card No</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Sex</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize).map(({ _id, firstname, sex, cardno, age }) => (
            <TableRow key={_id} onClick={() => router.push(`/doctor/medicaldata/medicalhistory/all/${_id}`)}>
              <TableCell>{firstname}</TableCell>
              <TableCell>{cardno}</TableCell>
              <TableCell>{age}</TableCell>
              <TableCell>{sex}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-2 mt-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => handlePageChange(0)} disabled={pageIndex === 0}>
            <DoubleLeftOutlined className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => handlePageChange(pageIndex - 1)} disabled={pageIndex === 0}>
            <LeftOutlined className="h-4 w-4" />
          </Button>
          <Select value={`${pageSize}`} onValueChange={(value) => setPageSize(Number(value))}>
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
          <Button variant="outline" onClick={() => handlePageChange(pageIndex + 1)} disabled={pageIndex >= totalPages - 1}>
            <RightOutlined className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => handlePageChange(totalPages - 1)} disabled={pageIndex >= totalPages - 1}>
            <DoubleRightOutlined className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
