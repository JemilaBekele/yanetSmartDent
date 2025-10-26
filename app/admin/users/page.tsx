"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import DataTable from "@/app/components/ui/TableComponent";
import { CodeOutlined, DownloadOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";
import Spinner from '@/app/components/ui/Spinner';
import * as XLSX from 'xlsx';

type Branch = {
  _id: string;
  name: string;
  location: string;
  phone: string;
};

type User = {
  _id: string;
  username: string;
  phone: string;
  role: string;
  experience?: number | null;
  position?: string | null;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  labassistant?: boolean;
  labtechnician?: boolean;
  labhead?: boolean;
  receptionist?: boolean;
  customservice?: boolean;
  branch?: Branch | null;
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true); 
        const response = await axios.get("/api/register");
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await axios.get("/api/Branch");
        setBranches(response.data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchUsers();
    fetchBranches();
  }, []);

  // Filter users based on search term, role filter, and branch filter
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.branch?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.branch?.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply branch filter
    if (branchFilter !== "all") {
      filtered = filtered.filter(user => user.branch?._id === branchFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, branchFilter, users]);

  const exportToExcel = () => {
    setExportLoading(true);
    try {
      // Prepare data for Excel export
      const excelData = filteredUsers.map(user => ({
        'Username': user.username,
        'Phone': user.phone,
        'Role': user.role,
        'Branch': user.branch?.name || 'No Branch',
        'Branch Location': user.branch?.location || '-',
        'Experience (Years)': user.experience || '-',
        'Position': user.position || '-',
        'Lead Doctor': user.lead ? 'Yes' : 'No',
        'Senior Doctor': user.senior ? 'Yes' : 'No',
        'Junior Doctor': user.junior ? 'Yes' : 'No',
        'Head Nurse': user.head ? 'Yes' : 'No',
        'Lab Assistant': user.labassistant ? 'Yes' : 'No',
        'Lab Technician': user.labtechnician ? 'Yes' : 'No',
        'Head Technician': user.labhead ? 'Yes' : 'No',
        'Receptionist': user.receptionist ? 'Yes' : 'No',
        'Customer Service': user.customservice ? 'Yes' : 'No',
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Username
        { wch: 15 }, // Phone
        { wch: 12 }, // Role
        { wch: 15 }, // Branch
        { wch: 20 }, // Branch Location
        { wch: 15 }, // Experience
        { wch: 20 }, // Position
        { wch: 12 }, // Lead Doctor
        { wch: 13 }, // Senior Doctor
        { wch: 13 }, // Junior Doctor
        { wch: 12 }, // Head Nurse
        { wch: 13 }, // Lab Assistant
        { wch: 13 }, // Lab Technician
        { wch: 13 }, // Head Technician
        { wch: 12 }, // Receptionist
        { wch: 15 }, // Customer Service
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Users');

      // Generate Excel file and download
      const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const getRoleBadges = (user: User) => {
    const badges: React.ReactNode[] = [];
    
    if (user.role === 'doctor') {
      if (user.lead) badges.push(<span key="lead" className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full mr-1">Lead</span>);
      if (user.senior) badges.push(<span key="senior" className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mr-1">Senior</span>);
      if (user.junior) badges.push(<span key="junior" className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full mr-1">Junior</span>);
    } else if (user.role === 'nurse' && user.head) {
      badges.push(<span key="head" className="inline-block px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full mr-1">Head</span>);
    } else if (user.role === 'labratory') {
      if (user.labassistant) badges.push(<span key="lab-assistant" className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full mr-1">Lab Assistant</span>);
      if (user.labtechnician) badges.push(<span key="lab-technician" className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full mr-1">Lab Technician</span>);
      if (user.labhead) badges.push(<span key="lab-head" className="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full mr-1">Head Technician</span>);
    } else if (user.role === 'reception') {
      if (user.receptionist) badges.push(<span key="receptionist" className="inline-block px-2 py-1 text-xs bg-violet-100 text-violet-800 rounded-full mr-1">Receptionist</span>);
      if (user.customservice) badges.push(<span key="customer-service" className="inline-block px-2 py-1 text-xs bg-fuchsia-100 text-fuchsia-800 rounded-full mr-1">Customer Service</span>);
    }

    return badges.length > 0 ? <>{badges}</> : '-';
  };

  const getRoleDisplay = (user: User) => {
    if (user.role === 'reception') {
      return 'Front Desk Officer';
    }
    return user.role;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
    setBranchFilter("all");
  };

  const columns = [
    {
      header: "Username",
      key: "username" as keyof User,
      render: (user: User) => user.username,
    },
    {
      header: "Phone",
      key: "phone" as keyof User,
      render: (user: User) => user.phone,
    },
    {
      header: "Role",
      key: "role" as keyof User,
      render: (user: User) => (
        <div className="flex flex-col">
          <span className="capitalize">{getRoleDisplay(user)}</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {getRoleBadges(user)}
          </div>
        </div>
      ),
    },
    {
      header: "Branch",
      key: "branch" as keyof User,
      render: (user: User) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">
            {user.branch?.name || 'No Branch'}
          </span>
          {user.branch?.location && (
            <span className="text-xs text-slate-500">
              {user.branch.location}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Experience (yrs)",
      key: "experience" as keyof User,
      render: (user: User) => user.experience ?? "-",
    },
    {
      header: "Position",
      key: "position" as keyof User,
      render: (user: User) => user.position ?? "-",
    },
  ];

  if (loading) return (
    <div className="mt-24 ml-0 lg:ml-60 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Spinner />
        <p className="mt-4 text-slate-600 font-light">Loading users...</p>
      </div>
    </div>
  );
return (
  <div className="flex flex-col lg:ml-9  mt-4 lg:mt-7 px-4 sm:px-6">
    <div className="flex-grow md:ml-60 container mx-auto w-full">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-5 mb-2">Users Management</h1>
            <p className="text-sm sm:text-base text-slate-600">Manage all registered users in the system</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link 
              href="/admin/users/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 text-center text-sm sm:text-base"
            >
              Create New User
            </Link>
            
            <button
              onClick={exportToExcel}
              disabled={exportLoading || filteredUsers.length === 0}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4 sm:mt-6">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-xs sm:text-sm text-blue-800">Total Users</div>
          </div>
          <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
              {users.filter(user => user.role === 'doctor').length}
            </div>
            <div className="text-xs sm:text-sm text-green-800">Doctors</div>
          </div>
          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
              {users.filter(user => user.role === 'nurse').length}
            </div>
            <div className="text-xs sm:text-sm text-purple-800">Nurses</div>
          </div>
          <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
              {users.filter(user => user.role === 'labratory').length}
            </div>
            <div className="text-xs sm:text-sm text-orange-800">Lab Staff</div>
          </div>
          <div className="bg-indigo-50 p-3 sm:p-4 rounded-lg border border-indigo-200 col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">
              {users.filter(user => user.role === 'reception').length}
            </div>
            <div className="text-xs sm:text-sm text-indigo-800">Front Desk</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Search Input */}
            <div className="relative flex-1">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
              />
            </div>

            {/* Filter and Clear Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200 flex-1 justify-center text-sm sm:text-base"
              >
                <FilterOutlined />
                Filters
                {(searchTerm || roleFilter !== "all" || branchFilter !== "all") && (
                  <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[searchTerm, roleFilter !== "all", branchFilter !== "all"].filter(Boolean).length}
                  </span>
                )}
              </button>

              {(searchTerm || roleFilter !== "all" || branchFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 text-sm sm:text-base whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-xs sm:text-sm text-slate-600">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="reception">Front Desk Officer</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="User">User</option>
                  <option value="labratory">Laboratory</option>
                </select>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Filter by Branch
                </label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base"
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
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <DataTable
          data={filteredUsers}
          columns={columns}
          caption={`Showing ${filteredUsers.length} users. Click the eye icon to view details.`}
          actions={(user: User) => (
            <Link 
              href={`/admin/users/${user._id}`}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg transition-all duration-200 group"
              title="View User Details"
            >
              <CodeOutlined className="text-base sm:text-lg group-hover:scale-110 transition-transform" />
            </Link>
          )}
        />
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2">
              {users.length === 0 ? "No Users Found" : "No Users Match Your Search"}
            </h3>
            <p className="text-slate-600 mb-4 text-sm sm:text-base">
              {users.length === 0 
                ? "Get started by creating your first user." 
                : "Try adjusting your search terms or filters."}
            </p>
            {users.length === 0 ? (
              <Link 
                href="/admin/users/create"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                Create User
              </Link>
            ) : (
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
    </div>
  </div>
);
};

export default UsersPage;