"use client";
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from 'next-auth/react';
import { signOut } from "next-auth/react";

type User = {
  _id: string;
  cardno: string;
  firstname: string;
  age: string;
  sex: string;
  phoneNumber: string;
};

const UsersPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');

  // Memoized user role
  const role = useMemo(() => session?.user?.role || '', [session]);

  // Role-to-route mapping
  const roleToRouteMap: { [key: string]: string } = {
    User: "/user/{patientId}", // Placeholder for dynamic patient ID
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const handleBack = () => {
    router.push('/user'); // Navigate to LandingPage
  };

  const fetchUsers = async () => {
    if (!firstName) {
      setError("Please provide a first name.");
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/app/patientfilter', { firstName });
      if (Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else {
        setError('Unexpected data format received from server');
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError('No patients found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Records</h1>
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            aria-label="Back to home"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter patient's first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              aria-label="Search by first name"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Error and Loading Messages */}
        {error && (
          <div className="text-red-600 bg-red-100 p-4 rounded-md mb-6 text-center">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-gray-600 bg-gray-200 p-4 rounded-md mb-6 text-center">
            Loading...
          </div>
        )}

        {/* Users Table */}
        {users.length > 0 && !loading && (
          <Table>
            <TableCaption className="text-gray-600 mb-4">A list of patients matching your search.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold text-gray-800">Card No</TableHead>
                <TableHead className="font-semibold text-gray-800">Name</TableHead>
                <TableHead className="font-semibold text-gray-800">Age</TableHead>
                <TableHead className="font-semibold text-gray-800">Sex</TableHead>
                <TableHead className="font-semibold text-gray-800">Phone Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const route = roleToRouteMap[role]?.replace("{patientId}", user._id);
                return (
                  <TableRow
                    key={user._id}
                    onClick={() => {
                      if (route) {
                        router.push(route);
                      } else {
                        console.error(`No route found for role: ${role}`);
                      }
                    }}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <TableCell>{user.cardno}</TableCell>
                    <TableCell>{user.firstname}</TableCell>
                    <TableCell>{user.age}</TableCell>
                    <TableCell>{user.sex}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <button
          className="w-full bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors mt-6"
          onClick={handleLogout}
          aria-label="Log out"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default UsersPage;