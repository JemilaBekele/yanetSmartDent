
    
        "use client";
        
        import * as React from 'react';
        import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
        import { useEffect, useState, useCallback } from 'react';
        import '@/app/components/ui/DataTable.css';
        import { useRouter } from 'next/navigation';
        import { CodeOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, UserOutlined, IdcardOutlined, PhoneOutlined } from '@ant-design/icons';
        import Link from 'next/link';
        import * as XLSX from 'xlsx';
        import debounce from 'lodash/debounce';
import Spinner from '@/app/components/ui/Spinner';
        
        // Define an interface for the patient data
        interface Patient {
          _id: string;
          cardno: string;
          firstname: string;
          age: string;
          phoneNumber: string;
          sex: string;
          branch?: {
            _id: string;
            name: string;
          };
          createdAt: string;
        }
        
        interface DataRow {
          id: number;
          ID: string;
          cardno: string;
          firstName: string;
          age: string;
          phoneNumber: string;
          sex: string;
          branch?: string;
        }
        
        interface Branch {
          _id: string;
          name: string;
        }
        
        const DataTable: React.FC = () => {
          const [patients, setPatients] = useState<Patient[]>([]);
          const [rows, setRows] = useState<DataRow[]>([]);
          const [loading, setLoading] = useState<boolean>(true);
          const [exportLoading, setExportLoading] = useState(false);
          
          // Separate search states for different fields
          const [nameSearch, setNameSearch] = useState("");
          const [cardnoSearch, setCardnoSearch] = useState("");
          const [phoneSearch, setPhoneSearch] = useState("");
          
          const [branchFilter, setBranchFilter] = useState("all");
          const [sexFilter, setSexFilter] = useState("all");
          const [showFilters, setShowFilters] = useState(false);
          const [branches, setBranches] = useState<Branch[]>([]);
        
          const router = useRouter();
        
          // Debounced fetch function to avoid too many API calls
          const fetchPatients = useCallback(
            debounce(async (filters: { 
              name?: string; 
              cardno?: string; 
              phone?: string;
              branch?: string; 
              sex?: string; 
            }) => {
              try {
                setLoading(true);
                
                // Build query string from filters
                const params = new URLSearchParams();
                if (filters.name) params.append('name', filters.name);
                if (filters.cardno) params.append('cardno', filters.cardno);
                if (filters.phone) params.append('phone', filters.phone);
                if (filters.branch && filters.branch !== 'all') params.append('branch', filters.branch);
                if (filters.sex && filters.sex !== 'all') params.append('sex', filters.sex);
        
                const url = `/api/patient/registerdata/lastthreeday?${params.toString()}`;
                const response = await fetch(url, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });
                
                if (!response.ok) {
                  throw new Error('Failed to fetch patients');
                }
                
                const data: Patient[] = await response.json();
                setPatients(data);
                
                // Transform data for DataGrid
                setRows(data.map((patient: Patient, index: number) => ({
                  id: index + 1,
                  ID: patient._id,
                  cardno: patient.cardno,
                  firstName: patient.firstname,
                  age: patient.age,
                  phoneNumber: patient.phoneNumber,
                  sex: patient.sex,
                  branch: patient.branch?.name,
                })));
              } catch (error) {
                console.error('Error fetching patient data:', error);
              } finally {
                setLoading(false);
              }
            }, 500), // 500ms debounce delay
            []
          );
        
          // Initial data fetch
          useEffect(() => {
            fetchPatients({});
            
            const fetchBranches = async () => {
              try {
                const response = await fetch('/api/Branch');
                const data = await response.json();
                setBranches(data);
              } catch (error) {
                console.error('Error fetching branches:', error);
              }
            };
        
            fetchBranches();
          }, [fetchPatients]);
        
          // Fetch data when filters change
          useEffect(() => {
            const filters: { 
              name?: string; 
              cardno?: string; 
              phone?: string;
              branch?: string; 
              sex?: string; 
            } = {};
            
            if (nameSearch) filters.name = nameSearch;
            if (cardnoSearch) filters.cardno = cardnoSearch;
            if (phoneSearch) filters.phone = phoneSearch;
            if (branchFilter !== "all") filters.branch = branchFilter;
            if (sexFilter !== "all") filters.sex = sexFilter;
            
            fetchPatients(filters);
          }, [nameSearch, cardnoSearch, phoneSearch, branchFilter, sexFilter, fetchPatients]);
        
          const exportToExcel = () => {
            setExportLoading(true);
            try {
              const excelData = patients.map(patient => ({
                'Card No': patient.cardno,
                'First Name': patient.firstname,
                'Age': patient.age,
                'Phone Number': patient.phoneNumber,
                'Sex': patient.sex,
                'Branch': patient.branch?.name || 'No Branch',
                'Created Date': new Date(patient.createdAt).toLocaleDateString(),
              }));
        
              const wb = XLSX.utils.book_new();
              const ws = XLSX.utils.json_to_sheet(excelData);
        
              const colWidths = [
                { wch: 15 }, // Card No
                { wch: 20 }, // First Name
                { wch: 10 }, // Age
                { wch: 15 }, // Phone Number
                { wch: 10 }, // Sex
                { wch: 20 }, // Branch
                { wch: 15 }, // Created Date
              ];
              ws['!cols'] = colWidths;
        
              XLSX.utils.book_append_sheet(wb, ws, 'Patients');
              const fileName = `patients_export_${new Date().toISOString().split('T')[0]}.xlsx`;
              XLSX.writeFile(wb, fileName);
            } catch (error) {
              console.error("Error exporting to Excel:", error);
              alert("Error exporting data to Excel. Please try again.");
            } finally {
              setExportLoading(false);
            }
          };
        
          const handleViewDetails = (row: DataRow) => {
            router.push(`/admin/finace/Invoice/all/${row.ID}`);
          };
        
          const clearFilters = () => {
            setNameSearch("");
            setCardnoSearch("");
            setPhoneSearch("");
            setBranchFilter("all");
            setSexFilter("all");
          };
        
          const columns: GridColDef[] = [
            { field: 'cardno', headerName: 'Card No', flex: 1 },
            { field: 'firstName', headerName: 'First Name', flex: 1 },
            { field: 'phoneNumber', headerName: 'Phone Number', flex: 1 },
            { field: 'sex', headerName: 'Sex', flex: 0.8 },
            { field: 'age', headerName: 'Age', flex: 0.8 },
            { field: 'branch', headerName: 'Branch', flex: 1.2 },
            {
              field: 'actions',
              type: 'actions',
              headerName: 'Actions',
              flex: 0.8,
              getActions: (params: { row: DataRow }) => [
                <GridActionsCellItem
                  key={`view-${params.row.id}`}
                  icon={<CodeOutlined className="text-2xl text-gray-600 group-hover:text-white" />}
                  label="View"
                  onClick={() => handleViewDetails(params.row)}
                />
              ],
            },
          ];
        
          // Check if any filters are active
          const hasActiveFilters = nameSearch || cardnoSearch || phoneSearch || branchFilter !== "all" || sexFilter !== "all";
        
          if (loading && patients.length === 0) {
            return (
              <div className="flex-1 ml-60 flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <Spinner />
                  <p className="mt-4 text-gray-600 font-light">Loading patients...</p>
                </div>
              </div>
            );
          }
        return (                                
          <div className="flex flex-col md:flex-row min-h-screen pt-16"> {/* Changed to flex-row for sidebar */}
            {/* Main Content Area */}
            <div className="flex-1 md:ml-60 lg:ml-60 transition-all duration-300"> {/* Dynamic margin for sidebar */}
              <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4"> {/* Adjusted padding */}
                
                {/* Header Section */}
                <div className="mb-4 sm:mb-6">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center sm:text-left">
                    All Patients
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left mt-1">
                    Manage and search patient records
                  </p>
                </div>
        
                {/* Search and Filter Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 mb-4">
                  <div className="flex flex-col gap-3">
                    {/* Search Inputs Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {/* Name Search Input */}
                      <div className="relative">
                        <UserOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          placeholder="Search by name..."
                          value={nameSearch}
                          onChange={(e) => setNameSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
        
                      {/* Card Number Search Input */}
                      <div className="relative">
                        <IdcardOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          placeholder="Search by card number..."
                          value={cardnoSearch}
                          onChange={(e) => setCardnoSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
        
                      {/* Phone Search Input */}
                      <div className="relative">
                        <PhoneOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          placeholder="Search by phone..."
                          value={phoneSearch}
                          onChange={(e) => setPhoneSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>
        
                    {/* Action Buttons Row */}
                    <div className="flex flex-col xs:flex-row gap-2 justify-between items-start xs:items-center">
                      {/* Filter Buttons Group */}
                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Filter Toggle Button */}
                        <button
                          onClick={() => setShowFilters(!showFilters)}
                          className="flex items-center gap-1 xs:gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-xs sm:text-sm"
                        >
                          <FilterOutlined className="text-xs sm:text-sm" />
                          <span className="hidden xs:inline">More Filters</span>
                          <span className="xs:hidden">Filters</span>
                          {hasActiveFilters && (
                            <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center ml-1">
                              {[nameSearch, cardnoSearch, phoneSearch, branchFilter !== "all", sexFilter !== "all"].filter(Boolean).length}
                            </span>
                          )}
                        </button>
        
                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="px-2 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
        
                      {/* Export Button */}
                      <div className="flex gap-2 w-full xs:w-auto">
                        <button
                          onClick={exportToExcel}
                          disabled={exportLoading || patients.length === 0}
                          className="flex items-center justify-center gap-1 xs:gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-xs sm:text-sm flex-1 xs:flex-none"
                        >
                          {exportLoading ? (
                            <>
                              <Spinner />
                              <span className="hidden xs:inline">Exporting...</span>
                              <span className="xs:hidden">Exporting</span>
                            </>
                          ) : (
                            <>
                              <DownloadOutlined className="text-xs sm:text-sm" />
                              <span className="hidden xs:inline">Export Excel</span>
                              <span className="xs:hidden">Export</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
        
                    {/* Stats and Results Count */}
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-600">
                        Showing {patients.length} patients
                        {loading && <span className="ml-1">(Updating...)</span>}
                      </div>
                    </div>
        
                    {/* Expanded Filters */}
                    {showFilters && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Branch Filter */}
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Filter by Branch
                            </label>
                            <select
                              value={branchFilter}
                              onChange={(e) => setBranchFilter(e.target.value)}
                              className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
        
                          {/* Sex Filter */}
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Filter by Sex
                            </label>
                            <select
                              value={sexFilter}
                              onChange={(e) => setSexFilter(e.target.value)}
                              className="w-full px-2 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            >
                              <option value="all">All</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="none">None</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
        
                {/* Data Table Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
                  {patients.length > 0 ? (
                    <div className="overflow-x-auto">
                      <div className="min-w-[300px] sm:min-w-[500px] lg:min-w-full"> {/* Responsive min-width */}
                        <DataGrid
                          rows={rows}
                          columns={columns.map(col => ({
                            ...col,
                            flex: col.flex || 1,
                            minWidth: col.minWidth || 100,
                            cellClassName: 'text-xs sm:text-sm',
                          }))}
                          initialState={{
                            pagination: {
                              paginationModel: { page: 0, pageSize: 8 }, // Smaller page size for mobile
                            },
                          }}
                          pageSizeOptions={[8, 15, 25, 50]}
                          sx={{
                            '& .MuiDataGrid-cell': {
                              fontSize: '0.7rem', // Smaller on mobile
                              padding: '8px 4px',
                              '@media (min-width: 640px)': {
                                fontSize: '0.8rem',
                                padding: '12px 8px',
                              },
                              '@media (min-width: 1024px)': {
                                fontSize: '0.875rem',
                              },
                            },
                            '& .MuiDataGrid-columnHeaders': {
                              fontSize: '0.7rem',
                              '@media (min-width: 640px)': {
                                fontSize: '0.8rem',
                              },
                              '@media (min-width: 1024px)': {
                                fontSize: '0.875rem',
                              },
                            },
                            '& .MuiDataGrid-virtualScroller': {
                              minHeight: '200px',
                            },
                            '& .MuiDataGrid-row': {
                              maxHeight: '40px !important',
                              minHeight: '35px !important',
                              '@media (min-width: 640px)': {
                                maxHeight: '48px !important',
                                minHeight: '40px !important',
                              },
                            },
                          }}
                          density="compact"
                          disableColumnMenu={window.innerWidth < 640} // Hide column menu on mobile
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">
                        {loading ? "Loading patients..." : "No Patients Found"}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4 max-w-xs mx-auto">
                        {loading 
                          ? "Please wait while we fetch patient data..." 
                          : "Try adjusting your search terms or filters."}
                      </p>
                      {!loading && (
                        <button
                          onClick={clearFilters}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
        };
        
        export default DataTable;