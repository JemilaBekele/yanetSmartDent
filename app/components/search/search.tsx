import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from 'next-auth/react';
import { useSearchParams } from "next/navigation";
import { branch } from '../medicaldata/Consent/all';

type User = {
  _id: string;
  cardno: string;
  firstname: string;
  age: string;
  sex: string;
  phoneNumber: string;
  branch?:branch;
};

const UsersPage: React.FC = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || ""; 
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const role = useMemo(() => session?.user?.role || '', [session]);

  const roleToRouteMap: { [key: string]: string } = {
    admin: '/admin/medicaldata/medicalhistory/all/{patientId}',
    doctor: '/doctor/medicaldata/medicalhistory/all/{patientId}',
    reception: '/reception/card/all/{patientId}',
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
  
      try {
        // Regex to check if the search is a phone number
        const isPhoneNumber = /^(09|07|9|7)\d{8}$/;
        // Regex to check if the search is a card number (assuming card numbers are digits only)
        const isCardNumber = /^\d+$/;
        // Check if the search input might be a first name (only letters)
        const isFirstName = /^[a-zA-Z]+$/;
  
        // Determine the type of search input
        // Determine the type of search input
let endpoint = '';
if (isPhoneNumber.test(search)) {
  endpoint = `/api/patient/registerdata/search?phoneNumber=${search}`;
}else if (isFirstName.test(search)) {
  endpoint = `/api/patient/registerdata/search?firstname=${search}`; // Use 'firstname' to match the schema
} else {
  endpoint = `/api/patient/registerdata/search?cardno=${search}`;
}

  
        // Make the API call
        const response = await axios.get(endpoint);
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          setError('No patients found');
        }
      } catch (error) {
        setError('No patients found');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, [search]);
  
   // Ensure this dependency is correctly detecting changes

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
      <h1 className="text-3xl font-extrabold text-center mt-10 text-gray-800 mb-6">Patient</h1>
        {error && <div className="error mt-16">{error}</div>}
        {loading && <div className="loading mt-16">Loading...</div>}
        {users.length > 0 && !loading && (
          <Table>
            <TableCaption>A list of Patients.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Card No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Sex</TableHead>
                <TableHead>Phone Number</TableHead>

                <TableHead>Branch</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user._id} onClick={() => router.push(roleToRouteMap[role].replace('{patientId}', user._id))}>
                  <TableCell>{user.cardno}</TableCell>
                  <TableCell>{user.firstname}</TableCell>
                  <TableCell>{user.age}</TableCell>
                  <TableCell>{user.sex}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>{user?.branch?.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
