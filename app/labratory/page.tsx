"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Clock, Search } from "lucide-react";
import Skeleton from "@mui/material/Skeleton";
import Link from "next/link";

interface IDentalLabForm {
  _id: string;
  createdAt: string;
  finish?: boolean;
}

interface IPatientInfo {
  _id: string;
  cardno: string;
  firstname: string;
  age: number;
  sex: string;
  phoneNumber: string;
  Town: string;
  KK: string;
}

interface IPatientData {
  patientInfo: IPatientInfo;
  unfinishedForms: IDentalLabForm[];
}

const UnfinishedDentalLabForms: React.FC = () => {
  const [patients, setPatients] = useState<IPatientData[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<IPatientData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientsWithUnfinishedForms = async () => {
      try {
        const response = await fetch("/api/labratory/notfinish");
        if (!response.ok) {
          throw new Error("Failed to fetch patients with unfinished forms");
        }
        
        const data = await response.json();
        console.log("Fetched Patients with Unfinished Forms Data:", data);
        if (data.success) {
          setPatients(data.data);
          setFilteredPatients(data.data);
        } else {
          setError(data.message || data.error || "Unknown error occurred");
        }
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsWithUnfinishedForms();
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter(patient =>
        patient.patientInfo.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientInfo.cardno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientInfo.phoneNumber.includes(searchTerm) ||
        patient.patientInfo.Town.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientInfo.KK.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="max-w-16xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-6" />
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
  return (
   <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <p className="font-medium">No Laboratory Requests Found</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


  return (
   <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Patients with Unfinished Dental Lab Forms</h1>
        <p className="text-muted-foreground mb-4">
          Total: {patients.length} patient{patients.length !== 1 ? 's' : ''} with pending forms
          {searchTerm && ` (Filtered: ${filteredPatients.length})`}
        </p>
        
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name, card number, phone, town, or KK..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              {searchTerm ? (
                <>
                  <p className="text-lg">No patients found matching "{searchTerm}"</p>
                  <p className="text-sm mt-2">Try a different search term or clear the search.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg">No patients with unfinished dental lab forms found.</p>
                  <p className="text-sm mt-2">All forms are completed!</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredPatients.map((patientData) => (
            <Card key={patientData.patientInfo._id} className="overflow-hidden border-amber-200">
              <CardHeader className="bg-amber-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
  <Link href={`/labratory/labratory/all/${patientData.patientInfo._id}`}>
    <Button variant="outline">
      {patientData.patientInfo.firstname}
    </Button>
  </Link>
</CardTitle>
                    <CardDescription>
                      Card No: {patientData.patientInfo.cardno} | 
                      Age: {patientData.patientInfo.age} | 
                      Sex: {patientData.patientInfo.sex} | 
                      Phone: {patientData.patientInfo.phoneNumber}
                    </CardDescription>
                    <CardDescription>
                      Town: {patientData.patientInfo.Town} | 
                      KK: {patientData.patientInfo.KK}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    {patientData.unfinishedForms.length} pending form{patientData.unfinishedForms.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientData.unfinishedForms.map((form) => (
                      <TableRow key={form._id}>
                        <TableCell>{formatDate(form.createdAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnfinishedDentalLabForms;