"use client";

import { useState, useEffect } from 'react';
import { EyeOutlined } from "@ant-design/icons"; // Importing an icon for actions
import DataTable from '@/app/components/ui/TableComponent'; // Import your DataTable component
import { useRouter } from 'next/navigation'; // Import useRouter for navigation
import { Button } from "@/components/ui/button"
// Define an interface for the patient data
interface Patient {
  _id: string;
  cardno: string;
  firstname: string;
  lastname: string;
  age: number;
  phoneNumber: string;
  sex: string;
}

interface DataRow {
  id: number; // Unique ID for each row
  ID: string;
  cardno: string;
  firstName: string;
  age: number;
  phoneNumber: string;
  sex: string;
}

const PatientsPage: React.FC = () => {
  const [rows, setRows] = useState<DataRow[]>([]);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await fetch('/api/patient/registerdata/lastthreeday', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
    
    
        // Check if the response is ok (status code 200-299)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const data: Patient[] = await response.json();
    
        if (data.length === 0) {
          return; // Early return if no patients
        }
    
        setRows(data.map((patient: Patient, index: number) => ({
          id: index + 1,
          ID: patient._id,
          cardno: patient.cardno,
          firstName: patient.firstname,
          age: patient.age,
          phoneNumber: patient.phoneNumber,
          sex: patient.sex,
        })));
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };
    

    fetchPatients();
  }, []);

  const handleViewDetails = (row: DataRow) => {
    // Navigate to the patient details page or handle the view details logic
    router.push(`/nurse/card/all/${row.ID}`);
  };

  // Define columns for the DataTable
  const columns = [
    {
      header: "Card No",
      key: "cardno" as keyof DataRow,
      render: (row: DataRow) => row.cardno,
    },
    {
      header: "First Name",
      key: "firstName" as keyof DataRow,
      render: (row: DataRow) => row.firstName,
    },
    {
      header: "Sex",
      key: "sex" as keyof DataRow,
      render: (row: DataRow) => row.sex,
    },
    {
      header: "Phone Number",
      key: "phoneNumber" as keyof DataRow,
      render: (row: DataRow) => row.phoneNumber,
    },
    {
      header: "Age",
      key: "age" as keyof DataRow,
      render: (row: DataRow) => row.age,
    },
  ];

  return (
    <div className="mt-24 ml-0 lg:ml-60 w-full max-w-4xl lg:max-w-[calc(100%-15rem)] mx-auto p-5 rounded-lg">
     
      <h1 className="text-2xl font-bold mb-4">Recent Patient List</h1>
      <a href="/nurse/DiseaseReport" className="mb-5 mt-5 py-2 px-4 inline-block">
            <Button type="button" className="bg-gray-300 px-4 py-2 rounded">Disease Report</Button>
          </a>
 
  <a
    href="/nurse/gender"
    className="bg-gray-500 m-3 mt-5 text-white rounded-md py-2 px-4 inline-block"
  >
   Gender Static
  </a>
  <a
    href="/nurse/patientOrg"
    className="bg-gray-500 m-3 mt-5 text-white rounded-md py-2 px-4 inline-block"
  >
   Creadit Patients 
  </a>
      <DataTable
        data={rows}
        columns={columns}
        caption="List of Patients"
        actions={(row: DataRow) => (
          <button onClick={() => handleViewDetails(row)}>
            <EyeOutlined /> 
          </button>
        )}
      />
    </div>
  );
};

export default PatientsPage;