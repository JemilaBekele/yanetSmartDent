'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

type Patient = {
  _id: string;
  phoneNumber: string;
  firstname: string;
};

type Doctor = {
  _id: string;
  username: string;
};

const OrderForm = () => {
  const [searchValue, setSearchValue] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('phoneNumber');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [status, setStatus] = useState<string>('Active');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get("/api/Doctor");
        if (response.data && Array.isArray(response.data)) {
          setDoctors(response.data);
        } else {
          console.error("Invalid doctor data format");
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };
  
    fetchDoctors();
  }, []);
  

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    if (!selectedDoctor) {
      setError('Please select a doctor');
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
          assignedDoctorId: selectedDoctor._id,
          status: status,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('Order created successfully');
        setError(null);
        setSelectedPatient(null);
        setSelectedDoctor(null);
        setStatus('Active');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 pt-10">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label htmlFor="searchType" className="block text-sm font-medium text-gray-700">Search By</label>
            <select
              id="searchType"
              name="searchType"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="phoneNumber">Phone Number</option>
              <option value="cardno">Card ID</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="searchValue" className="block text-sm font-medium text-gray-700">
              {searchType === 'phoneNumber' ? 'Search Patient by Phone Number' : 'Search Patient by Card ID'}
            </label>
            <input
              id="searchValue"
              name="searchValue"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="mt-2 w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
            </button>
          </div>

          {patients.length > 0 && (
            <div className="mb-4">
              <label htmlFor="patient" className="block text-sm font-medium text-gray-700">Select Patient</label>
              <select
                id="patient"
                name="patient"
                value={selectedPatient?._id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setSelectedPatient(patients.find(patient => patient._id === selectedId) || null);
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a patient</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstname}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">Select Doctor</label>
            <select
              id="doctor"
              name="doctor"
              value={selectedDoctor?._id || ''}
              onChange={(e) => {
                const selectedId = e.target.value;
                const doctor = doctors.find(doctor => doctor._id === selectedId);
                if (doctor) {
                  setSelectedDoctor(doctor);
                } else {
                  setError('No doctor found');
                }
              }}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.username}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Order
          </button>

          {error && <p className="mt-4 text-center bg-red-300 text-red-600">{error}</p>}
          {success && <p className="mt-4 text-center bg-green-300 text-green-600">{success}</p>}
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
