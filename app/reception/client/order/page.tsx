'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { branch } from '@/app/components/medicaldata/Consent/all';

type Patient = {
  _id: string;
  phoneNumber: string;
  firstname: string;
  branch: branch;
};

type MedicalStaff = {
  _id: string;
  username: string;
  role: string;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  position?: string;
};

const OrderForm = () => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('phoneNumber');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalStaff, setMedicalStaff] = useState<MedicalStaff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<MedicalStaff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<MedicalStaff | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>(''); // 'doctor' or 'nurse'
  const [staffSearch, setStaffSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('Active');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchMedicalStaff = async () => {
      try {
        const response = await axios.get("/api/Doctor/both");
        if (response.data && Array.isArray(response.data)) {
          setMedicalStaff(response.data);
        } else {
          console.error("Invalid medical staff data format");
        }
      } catch (error) {
        console.error("Error fetching medical staff:", error);
      }
    };

    fetchMedicalStaff();
  }, []);

  // Filter staff based on selected role and search
  useEffect(() => {
    let filtered = medicalStaff;
    
    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(staff => staff.role === selectedRole);
    }
    
    // Filter by search term
    if (staffSearch) {
      filtered = filtered.filter(staff => 
        staff.username.toLowerCase().includes(staffSearch.toLowerCase()) ||
        staff.position?.toLowerCase().includes(staffSearch.toLowerCase())
      );
    }
    
    setFilteredStaff(filtered);
  }, [medicalStaff, selectedRole, staffSearch]);

  const handleSearch = async () => {
    if (!searchValue) {
      setError(`Please enter a ${searchType === 'phoneNumber' ? 'phoneNumber' : 'Card ID'}`);
      return;
    }

    try {
      const response = await fetch(`/api/patient/order/patientord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [searchType]: searchValue,
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setPatients(Array.isArray(data) ? data : [data]);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch patients');
      }
    } catch (err) {
      setError('An error occurred while fetching patients');
    }
  };

  const getStaffBadge = (staff: MedicalStaff) => {
    if (staff.role === 'doctor') {
      if (staff.lead) return '👑 Lead Doctor';
      if (staff.senior) return '⭐ Senior Doctor';
      if (staff.junior) return '👨‍⚕️ Junior Doctor';
      return '👨‍⚕️ Doctor';
    } else if (staff.role === 'nurse') {
      if (staff.head) return '👩‍⚕️ Head Nurse';
      return '👩‍⚕️ Nurse';
    }
    return staff.role;
  };

  const getStaffDisplayName = (staff: MedicalStaff) => {
    const badge = getStaffBadge(staff);
    return `${staff.username} - ${badge}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (!selectedStaff) {
      setError('Please select a medical staff');
      return;
    }

    try {
      const response = await fetch(`/api/patient/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          assignedDoctorId: selectedStaff._id,
          status: status,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Order created successfully');
        setError(null);
        setSelectedPatient(null);
        setSelectedStaff(null);
        setSelectedRole('');
        setStaffSearch('');
        setStatus('Active');
        setPatients([]);
        setSearchValue('');
        router.refresh();
      } else {
        setError(result.error || 'Failed to create order');
        setSuccess(null);
      }
    } catch (err) {
      setError('An error occurred while creating the order');
      setSuccess(null);
    }
  };

  return (
    <div className="min-h-screen mt-10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create New Order</h1>
          <p className="text-lg text-gray-600">Search for patient and assign medical staff</p>
        </div>

        {/* Main Form - Added onSubmit handler */}
        <form onSubmit={handleSubmit}>
          {/* Main Content Grid - Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Patient Information */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Patient Information
                  </h3>
                  
                  {/* Search Type and Value in Horizontal Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-2">
                        Search by
                      </label>
                      <select
                        id="searchType"
                        name="searchType"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="phoneNumber">Phone Number</option>
                        <option value="cardno">Card ID</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="searchValue" className="block text-sm font-medium text-gray-700 mb-2">
                        {searchType === 'phoneNumber' ? 'Phone Number' : 'Card ID'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="searchValue"
                          name="searchValue"
                          type="text"
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          placeholder={`Enter ${searchType === 'phoneNumber' ? 'phone number' : 'card ID'}`}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search Patient
                  </button>

                  {/* Patient Results - Full Width */}
                  {patients.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <label htmlFor="patient" className="block text-sm font-medium text-blue-900 mb-2">
                        Select Patient ({patients.length} found)
                      </label>
                      <select
                        id="patient"
                        name="patient"
                        value={selectedPatient?._id || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          setSelectedPatient(patients.find(patient => patient._id === selectedId) || null);
                        }}
                        className="block w-full px-4 py-3 border border-blue-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="">Choose a patient...</option>
                        {patients.map(patient => (
                          <option key={patient._id} value={patient._id}>
                            {patient.firstname} • {patient.branch?.name} • {patient.phoneNumber}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Selected Patient Display - Horizontal Layout */}
                  {selectedPatient && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="font-medium text-green-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Patient Selected
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-green-700">
                        <div>
                          <strong className="block text-green-800">Name</strong>
                          {selectedPatient.firstname}
                        </div>
                        <div>
                          <strong className="block text-green-800">Branch</strong>
                          {selectedPatient.branch?.name}
                        </div>
                        <div>
                          <strong className="block text-green-800">Phone</strong>
                          {selectedPatient.phoneNumber}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Medical Staff & Status */}
            <div className="space-y-8">
              
              {/* Medical Staff Section */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <svg className="w-6 h-6 text-indigo-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Medical Staff Assignment
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                          Staff Type
                        </label>
                        <select
                          id="role"
                          name="role"
                          value={selectedRole}
                          onChange={(e) => {
                            setSelectedRole(e.target.value);
                            setSelectedStaff(null);
                            setStaffSearch('');
                          }}
                          className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        >
                          <option value="">Select staff type</option>
                          <option value="doctor">Doctor</option>
                          <option value="nurse">Nurse</option>
                        </select>
                      </div>

                      {selectedRole && (
                        <>
                          <div>
                            <label htmlFor="staffSearch" className="block text-sm font-medium text-gray-700 mb-2">
                              Search {selectedRole === 'doctor' ? 'Doctors' : 'Nurses'}
                            </label>
                            <input
                              id="staffSearch"
                              name="staffSearch"
                              type="text"
                              value={staffSearch}
                              onChange={(e) => setStaffSearch(e.target.value)}
                              placeholder={`Type to search ${selectedRole}s...`}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            />
                          </div>

                          <div>
                            <label htmlFor="staff" className="block text-sm font-medium text-gray-700 mb-2">
                              Select {selectedRole === 'doctor' ? 'Doctor' : 'Nurse'}
                            </label>
                            <select
                              id="staff"
                              name="staff"
                              value={selectedStaff?._id || ''}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const staff = filteredStaff.find(staff => staff._id === selectedId);
                                setSelectedStaff(staff || null);
                              }}
                              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            >
                              <option value="">Choose a {selectedRole}...</option>
                              {filteredStaff.map(staff => (
                                <option key={staff._id} value={staff._id}>
                                  {getStaffDisplayName(staff)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      {/* Selected Staff Display - Horizontal Layout */}
                      {selectedStaff && (
                        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                          <h4 className="font-medium text-indigo-900 mb-3 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Staff Selected
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-700">
                            <div>
                              <strong className="block text-indigo-800">Name</strong>
                              {selectedStaff.username}
                            </div>
                            <div>
                              <strong className="block text-indigo-800">Role</strong>
                              {getStaffBadge(selectedStaff)}
                            </div>
                            {selectedStaff.position && (
                              <div className="md:col-span-2">
                                <strong className="block text-indigo-800">Position</strong>
                                {selectedStaff.position}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Submit Section */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="space-y-6">
                    {/* Status Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Order Status
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="radio"
                              name="status"
                              value="Active"
                              checked={status === "Active"}
                              onChange={(e) => setStatus(e.target.value)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                          </div>
                          <span className="text-gray-700 font-medium">Active</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="radio"
                              name="status"
                              value="Inactive"
                              checked={status === "Inactive"}
                              onChange={(e) => setStatus(e.target.value)}
                              className="h-5 w-5 text-gray-600 focus:ring-gray-500 border-gray-300"
                            />
                          </div>
                          <span className="text-gray-700 font-medium">Inactive</span>
                        </label>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!selectedPatient || !selectedStaff}
                      className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Order
                    </button>

                    {/* Messages */}
                    {error && (
                      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-red-800 font-medium">{error}</p>
                        </div>
                      </div>
                    )}

                    {success && (
                      <div className="rounded-lg bg-green-50 p-4 border border-green-200">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-green-800 font-medium">{success}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;