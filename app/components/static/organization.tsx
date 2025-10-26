import React, { useState, useEffect , useMemo } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent,
} from "@mui/material";
import { useSession } from "next-auth/react";

// Define interfaces for organization and patient data
interface Patient {
  id: {
    _id:string
    cardno: string;
    firstname: string;
    age: string;
    sex: string;
    phoneNumber: string;
    Town?: string;
    Region?: string;
    description?: string;
    disablity?: boolean;
  };
}

interface Organization {
  _id: string;
  organization: string;
  createdBy: any;
  patient: Patient[];
  createdAt: string;
  updatedAt: string;
}

interface DataRow {
  id: string;
  organizationName: string;
  cardno: string;
  firstname: string;
  age: string;
  sex: string;
  phoneNumber: string;
  patientId: string;  // Separate patient ID
}

const OrganizationDataTable: React.FC = () => {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<DataRow[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("");
  const [organizations, setOrganizations] = useState<string[]>([]);
  const router = useRouter();
const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || '', [session]);
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/Orgnazation", {
          headers: {
            "Content-Type": "application/json",
          },
        });
        const { data }: { data: Organization[] } = await response.json();

        console.log("Fetched data:", data); // Debugging

        // Extract unique organization names
        setOrganizations(data.map((org) => org.organization));

        // Process patient data
        const allRows = data.flatMap((organization) => {
          if (!organization.patient || !Array.isArray(organization.patient)) return [];

          return organization.patient
            .filter((patient) => patient && patient.id) // Ensure only valid patients
            .map((patient) => ({
              id: patient.id._id || crypto.randomUUID(), // Use patient's unique ID
              organizationName: organization.organization,
              cardno: patient.id.cardno || "N/A",
              firstname: patient.id.firstname || "Unknown",
              age: patient.id.age || "N/A",
              sex: patient.id.sex || "N/A",
              phoneNumber: patient.id.phoneNumber || "N/A",
              patientId: patient.id._id,  // Add patient ID as separate field
            }));
        });

        console.log("Processed patient data:", allRows); // Debugging

        setRows(allRows);
        setFilteredRows(allRows);
      } catch (error) {
        console.error("Error fetching organization data:", error);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrganizationChange = (event: SelectChangeEvent<string>) => {
    const selectedOrg = event.target.value;
    setSelectedOrganization(selectedOrg);

    setFilteredRows(
      selectedOrg === "" ? rows : rows.filter((row) => row.organizationName === selectedOrg)
    );
  };

  const columns: GridColDef[] = [
    { field: "organizationName", headerName: "Organization", flex: 1 },
    { field: "cardno", headerName: "Card No", flex: 1 },
    { field: "firstname", headerName: "First Name", flex: 1 },
    { field: "age", headerName: "Age", flex: 0.5 },
    { field: "sex", headerName: "Sex", flex: 0.5 },
    { field: "phoneNumber", headerName: "Phone", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.8,
      renderCell: (params) => (
        <InfoCircleOutlined
          className="text-2xl text-gray-600 group-hover:text-white"
          onClick={() => {
            if (role === 'admin') {
              router.push(`/admin/finace/Invoice/all/${params.row.patientId}`);
            } else if (role === 'reception') {
              router.push(`/reception/card/all/${params.row.patientId}`);
            }
          }}
          
        />
      ),
    },
  ];

  return (
    <div className="flex-1 ml-60">
      <div className="mt-16 p-6">
        <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Organizations
        </h1>

        {/* Organization filter */}
        <FormControl fullWidth>
          <InputLabel id="organization-select-label">
            Select Organization
          </InputLabel>
          <Select
            labelId="organization-select-label"
            value={selectedOrganization}
            label="Select Organization"
            onChange={handleOrganizationChange}
          >
            <MenuItem value="">All</MenuItem>
            {organizations.map((organization) => (
              <MenuItem key={organization} value={organization}>
                {organization}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="data-table mt-4">
          <DataGrid rows={filteredRows} columns={columns} pageSizeOptions={[20, 40, 100]} />
        </div>
      </div>
    </div>
  );
};

export default OrganizationDataTable;
