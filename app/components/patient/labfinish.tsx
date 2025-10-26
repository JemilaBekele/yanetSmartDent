"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import {
  LeftOutlined,
  RightOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

interface IDentalLabForm {
  _id: string;
  createdAt: string;
  finish?: boolean;
  modelacceptance?: boolean;
  delivered?: boolean;
  status?: string;
  completed?: boolean;
  isFinished?: boolean;
}

interface PatientData {
  patientInfo: {
    _id: string;
    cardno: string;
    firstname: string;
    age: number;
    sex: string;
    phoneNumber: string;
    Town: string;
    KK: string;
  };
  finishedForms: IDentalLabForm[];
}

const FinishedDentalForms: React.FC = () => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
 const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("/api/labratory/finish/creator");
        if (!res.ok) throw new Error("Failed to fetch patients");
        const data = await res.json();
        console.log("Response:", data);

        if (data.success) {
          setPatients(data.data);
        } else {
          setError(data.message || "Unknown error occurred");
        }
      } catch (err) {
        setError("Failed to load patients");
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  if (loading) return <div>Loading patients...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;

  const handleViewForms = (patientId: string) => {
    router.push(`/${role}/labratory/all/${patientId}`);
  };
  const totalPages = Math.ceil(patients.length / pageSize);

  return (
   <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <h1 className="text-xl font-bold mb-5">
        Patients with Finished Dental Lab Forms 
      </h1>
      <Table>
        <TableCaption>A list of patients with finished dental lab forms.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Card No</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Town</TableHead>
            <TableHead>KK</TableHead>
            <TableHead>Last Finished Form</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients
            .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
            .map((p) => {
              const lastForm = p.finishedForms[0]; // already sorted by API
              return (
                <TableRow key={p.patientInfo._id}>
                  <TableCell>{p.patientInfo.cardno}</TableCell>
                  <TableCell>{p.patientInfo.firstname}</TableCell>
                  <TableCell>{p.patientInfo.age}</TableCell>
                  <TableCell>{p.patientInfo.sex}</TableCell>
                  <TableCell>{p.patientInfo.phoneNumber}</TableCell>
                  <TableCell>{p.patientInfo.Town}</TableCell>
                  <TableCell>{p.patientInfo.KK}</TableCell>
                  <TableCell>
                    {new Date(lastForm.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleViewForms(p.patientInfo._id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <FileSearchOutlined />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
      {/* Pagination */}
      <div className="flex items-center justify-between px-2 mt-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
          >
            <DoubleLeftOutlined className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setPageIndex((prev) => prev - 1)}
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
            onClick={() => setPageIndex((prev) => prev + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            <RightOutlined className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setPageIndex(totalPages - 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            <DoubleRightOutlined className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinishedDentalForms;
