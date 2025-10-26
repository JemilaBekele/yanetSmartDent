"use client";

import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import '@/app/components/ui/DataTable.css';
import { useRouter } from 'next/navigation';
import { CodeOutlined, InfoCircleOutlined, DownloadOutlined, SearchOutlined, FilterOutlined, MenuOutlined } from '@ant-design/icons';
import { Modal, Box, Typography } from '@mui/material';
import { Button } from '@/components/ui/button';
import Spinner from '@/app/components/ui/Spinner';
import * as XLSX from 'xlsx';
import Link from 'next/link';

// Define interfaces for patient data
interface Branch {
  _id: string;
  name: string;
  location: string;
  phone: string;
}

interface Patient {
  _id: string;
  cardno: string;
  firstname: string;
  lastname: string;
  age: number;
  sex: string;
  branch?: Branch | null;
  MedicalFinding: any[];
  invoiceHistory: Invoice[];
  creditHistory: Credit[];
}

interface Invoice {
  totalAmount: number;
  amount: number;
  createdAt: string;
  receipt?: string;
}

interface Credit {
  totalAmount: number;
  amount: number;
  createdAt: string;
}

interface DataRow {
  id: number;
  ID: string;
  cardno: string;
  firstName: string;
  age: number;
  sex: string;
  branch?: Branch | null;
}

const ParadonicDataTable: React.FC = () => {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<DataRow[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/statics/priodomant', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const { data }: { data: Patient[] } = await response.json();

        const formattedRows = data.map((patient, index) => ({
          id: index + 1,
          ID: patient._id,
          cardno: patient.cardno,
          firstName: patient.firstname,
          age: patient.age,
          sex: patient.sex,
          branch: patient.branch,
        }));

        setRows(formattedRows);
        setFilteredRows(formattedRows);

        // Extract unique branches from patients
        const uniqueBranches = data
          .filter(patient => patient.branch)
          .reduce((acc: Branch[], patient) => {
            if (patient.branch && !acc.find(b => b._id === patient.branch!._id)) {
              acc.push(patient.branch);
            }
            return acc;
          }, []);
        setBranches(uniqueBranches);
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Filter patients based on search term and branch filter
  useEffect(() => {
    let filtered = rows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        row.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.cardno.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.sex.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply branch filter
    if (branchFilter !== "all") {
      if (branchFilter === "no-branch") {
        filtered = filtered.filter(row => !row.branch);
      } else {
        filtered = filtered.filter(row => row.branch?._id === branchFilter);
      }
    }

    setFilteredRows(filtered);
  }, [searchTerm, branchFilter, rows]);

  const handleViewDetails = (row: DataRow) => {
    router.push(`/admin/finace/Invoice/all/${row.ID}`);
  };

  const handleShowModal = async (row: DataRow) => {
    try {
      const response = await fetch('/api/statics/ortho', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId: row.ID }),
      });

      const result: { success: boolean; data: Patient; message?: string } = await response.json();

      if (result.success) {
        setSelectedPatient(result.data);
        setIsModalOpen(true);
      } else {
        console.error('Error fetching patient details:', result.message);
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const exportToExcel = () => {
    setExportLoading(true);
    try {
      const excelData = filteredRows.map(row => ({
        'Card No': row.cardno,
        'First Name': row.firstName,
        'Age': row.age,
        'Sex': row.sex,
        'Branch': row.branch?.name || 'No Branch',
        'Branch Location': row.branch?.location || '-',
        'Branch Phone': row.branch?.phone || '-',
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 15 }, // Card No
        { wch: 20 }, // First Name
        { wch: 8 },  // Age
        { wch: 10 }, // Sex
        { wch: 15 }, // Branch
        { wch: 20 }, // Branch Location
        { wch: 15 }, // Branch Phone
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Prosthodontics Patients');
      const fileName = `prosthodontics_patients_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setBranchFilter("all");
  };

  // Mobile-friendly columns
  const mobileColumns: GridColDef[] = [
    { 
      field: 'cardno', 
      headerName: 'Card No', 
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span className="font-medium text-slate-800 text-sm">{params.value}</span>
      )
    },
    { 
      field: 'firstName', 
      headerName: 'Name', 
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <span className="text-slate-700 text-sm">{params.value}</span>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.6,
      minWidth: 80,
      renderCell: (params) => (
        <div className="flex gap-1">
          <button
            onClick={() => handleViewDetails(params.row)}
            className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded transition-all duration-200 group"
            title="View Details"
          >
            <CodeOutlined className="text-xs group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => handleShowModal(params.row)}
            className="inline-flex items-center justify-center w-7 h-7 bg-green-100 hover:bg-green-600 text-green-600 hover:text-white rounded transition-all duration-200 group"
            title="Patient Info"
          >
            <InfoCircleOutlined className="text-xs group-hover:scale-110 transition-transform" />
          </button>
        </div>
      ),
    },
  ];

  // Desktop columns
  const desktopColumns: GridColDef[] = [
    { 
      field: 'cardno', 
      headerName: 'Card No', 
      flex: 1,
      renderCell: (params) => (
        <span className="font-medium text-slate-800">{params.value}</span>
      )
    },
    { 
      field: 'firstName', 
      headerName: 'First Name', 
      flex: 1,
      renderCell: (params) => (
        <span className="text-slate-700">{params.value}</span>
      )
    },
    { 
      field: 'sex', 
      headerName: 'Sex', 
      flex: 0.5,
      renderCell: (params) => (
        <span className="capitalize">{params.value}</span>
      )
    },
    { 
      field: 'age', 
      headerName: 'Age', 
      flex: 0.5,
      renderCell: (params) => (
        <span className="text-slate-600">{params.value}</span>
      )
    },
    {
      field: 'branch',
      headerName: 'Branch',
      flex: 1,
      renderCell: (params) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800 text-sm">
            {params.value?.name || 'No Branch'}
          </span>
          {params.value?.location && (
            <span className="text-xs text-slate-500">
              {params.value.location}
            </span>
          )}
        </div>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleViewDetails(params.row)}
            className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition-all duration-200 group"
            title="View Details"
          >
            <CodeOutlined className="text-sm group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={() => handleShowModal(params.row)}
            className="inline-flex items-center justify-center w-8 h-8 bg-green-100 hover:bg-green-600 text-green-600 hover:text-white rounded-lg transition-all duration-200 group"
            title="Patient Info"
          >
            <InfoCircleOutlined className="text-sm group-hover:scale-110 transition-transform" />
          </button>
        </div>
      ),
    },
  ];

  const columns = isMobile ? mobileColumns : desktopColumns;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-slate-600 font-light">Loading prosthodontics patients...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {/* Add mobile menu toggle here */}}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                <MenuOutlined className="text-lg" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Prosthodontics</h1>
                <p className="text-xs text-slate-600">Patient Records</p>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              disabled={exportLoading || filteredRows.length === 0}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200"
            >
              {exportLoading ? (
                <>
                  <Spinner />
                  <span className="hidden sm:inline">Exporting...</span>
                </>
              ) : (
                <>
                  <DownloadOutlined className="text-xs" />
                  <span className="hidden sm:inline">Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-${isMobile ? '20' : '4'} pb-6 px-3 sm:px-4 md:px-6 ${isMobile ? '' : 'md:ml-60'}`}>
        
        {/* Desktop Header Section */}
        {!isMobile && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Prosthodontics Patients</h1>
                <p className="text-sm sm:text-base text-slate-600">Manage prosthodontics patients and their treatment records</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={exportToExcel}
                  disabled={exportLoading || filteredRows.length === 0}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  {exportLoading ? (
                    <>
                      <Spinner />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadOutlined />
                      Export Excel
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{rows.length}</div>
                <div className="text-xs sm:text-sm text-blue-800">Total Patients</div>
              </div>
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  {rows.filter(row => row.sex === 'male').length}
                </div>
                <div className="text-xs sm:text-sm text-green-800">Male</div>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  {rows.filter(row => row.sex === 'female').length}
                </div>
                <div className="text-xs sm:text-sm text-purple-800">Female</div>
              </div>
              <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                  {rows.filter(row => row.branch).length}
                </div>
                <div className="text-xs sm:text-sm text-orange-800">With Branch</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center sm:justify-start">
            <Link href="/admin/statics/ortho" className="inline-block">
              <Button type="button" className="bg-gray-300 hover:bg-gray-400 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm">
                Orthodontics
              </Button>
            </Link>
            <Link href="/admin/DiseaseReport" className="inline-block">
              <Button type="button" className="bg-gray-300 hover:bg-gray-400 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm">
                Disease Report
              </Button>
            </Link>
            <Link href="/admin/patienOrg" className="inline-block">
              <Button type="button" className="bg-gray-300 hover:bg-gray-400 px-3 sm:px-4 py-2 rounded text-xs sm:text-sm">
                Credit Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              {/* Search Input */}
              <div className="relative flex-1">
                <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isMobile ? "Search patients..." : "Search patients by name, card number, or sex..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                />
              </div>

              {/* Filter and Clear Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 flex-1 justify-center text-sm"
                >
                  <FilterOutlined />
                  {!isMobile && "Filters"}
                  {(searchTerm || branchFilter !== "all") && (
                    <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {[searchTerm, branchFilter !== "all"].filter(Boolean).length}
                    </span>
                  )}
                </button>

                {(searchTerm || branchFilter !== "all") && (
                  <button
                    onClick={clearFilters}
                    className="px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 text-sm whitespace-nowrap"
                  >
                    {isMobile ? "Clear" : "Clear Filters"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-xs sm:text-sm text-slate-600">
                Showing {filteredRows.length} of {rows.length} patients
              </div>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Branch Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Filter by Branch
                  </label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  >
                    <option value="all">All Branches</option>
                    <option value="no-branch">No Branch Assigned</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6">
          <div className="data-table" style={{ 
            height: isMobile ? '500px' : '600px',
            width: '100%'
          }}>
            <DataGrid 
              rows={filteredRows} 
              columns={columns} 
              pageSizeOptions={[10, 20, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: isMobile ? 10 : 20 },
                },
              }}
              sx={{
                '& .MuiDataGrid-cell': {
                  padding: isMobile ? '4px' : '8px',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                },
                '& .MuiDataGrid-virtualScroller': {
                  minHeight: isMobile ? '300px' : '400px',
                }
              }}
            />
          </div>
          
          {filteredRows.length === 0 && (
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
                {rows.length === 0 ? "No Patients Found" : "No Patients Match Your Search"}
              </h3>
              <p className="text-slate-600 mb-4 text-sm sm:text-base">
                {rows.length === 0 
                  ? "There are no prosthodontics patients in the system." 
                  : "Try adjusting your search terms or filters."}
              </p>
              {rows.length === 0 ? null : (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Patient Details Modal - Mobile Responsive */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} aria-labelledby="patient-details-title" aria-describedby="patient-details-description">
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: isMobile ? '90vw' : 400,
              maxHeight: '80vh',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 3,
              overflowY: 'auto',
            }}
          >
            <Typography id="patient-details-title" variant="h6" component="h2" className="text-slate-800">
              Patient Details
            </Typography>
            {selectedPatient ? (
              <Box id="patient-details-description" mt={2}>
                <Typography className="text-slate-700 text-sm sm:text-base">
                  <strong>Name:</strong> {selectedPatient?.firstname} {selectedPatient.lastname}
                </Typography>
                <Typography className="text-slate-700 text-sm sm:text-base">
                  <strong>Card No:</strong> {selectedPatient?.cardno}
                </Typography>
                {selectedPatient.branch && (
                  <Typography className="text-slate-700 text-sm sm:text-base">
                    <strong>Branch:</strong> {selectedPatient.branch.name} - {selectedPatient.branch.location}
                  </Typography>
                )}
                <Typography variant="subtitle1" mt={2} className="text-slate-800 font-semibold text-sm sm:text-base">Invoice History</Typography>
                {selectedPatient.invoiceHistory.length > 0 ? (
                  selectedPatient.invoiceHistory.map((invoice, index) => (
                    <Box key={index} mt={1} className="p-2 bg-slate-50 rounded">
                      <Typography className="text-slate-700 text-xs sm:text-sm"><strong>Total Amount:</strong> {invoice?.totalAmount}</Typography>
                      <Typography className="text-slate-700 text-xs sm:text-sm"><strong>Amount:</strong> {invoice?.amount}</Typography>
                      <Typography className="text-slate-700 text-xs sm:text-sm"><strong>Date:</strong> {new Date(invoice?.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography className="text-slate-500 text-xs sm:text-sm">No invoice history</Typography>
                )}
                <Typography variant="subtitle1" mt={2} className="text-slate-800 font-semibold text-sm sm:text-base">Credit History</Typography>
                {selectedPatient.creditHistory.length > 0 ? (
                  selectedPatient.creditHistory.map((credit, index) => (
                    <Box key={index} mt={1} className="p-2 bg-slate-50 rounded">
                      <Typography className="text-slate-700 text-xs sm:text-sm"><strong>Total Amount:</strong> {credit?.totalAmount}</Typography>
                      <Typography className="text-slate-700 text-xs sm:text-sm"><strong>Amount:</strong> {credit?.amount}</Typography>
                      <Typography className="text-slate-700 text-xs sm:text-sm"><strong>Date:</strong> {new Date(credit?.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  ))
                ) : (
                  <Typography className="text-slate-500 text-xs sm:text-sm">No credit history</Typography>
                )}
              </Box>
            ) : (
              <Typography>Loading...</Typography>
            )}
          </Box>
        </Modal>
      </div>
    </div>
  );
};

export default ParadonicDataTable;