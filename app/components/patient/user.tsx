import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';

import { useSession } from 'next-auth/react';

type Patient = {
  _id: string;
  cardno?: string;
  firstname?: string;
  age?: string;
  sex?: string;
  phoneNumber?: string;
  Town?: string;
  KK?: string;
  HNo?: string;
  description?: string;
  Region: string;
  Woreda: string;
  disablity: boolean;
  credit?:boolean;
  createdAt?: string;
};

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const UserComponent: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId = params.id;
  const { data: session } = useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const role = useMemo(() => session?.user?.role || '', [session]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`/api/patient/registerdata/${patientId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        setPatient(response.data);
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error fetching user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [patientId]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!patient) return <div>Patient not found</div>;

  const renderDetail = (label: string, value?: string) => {
    if (value) {
      return (
        <div className="flex flex-col mb-4">
          <h2 className="font-semibold text-gray-600">{label}</h2>
          <p className="text-gray-800">{value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white h-auto p-4 rounded-lg shadow-md">
      <div className="flex bg-white flex-col items-center space-y-4">
      <div className="text-center space-y-2">
  {/* Patient Name */}
  <h1 className="text-xl font-bold capitalize">{patient.firstname}</h1>

  {/* Patient Details */}
  <p className="text-gray-600">{patient.phoneNumber}</p>
  <p className="text-gray-600">{patient.age} yrs</p>
  
  {/* Patient Status (Credit & Disability) */}
  {(patient.credit || patient.disablity) && (
    <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-md inline-block">
      {patient.credit && <span>Credit</span>}
      {patient.credit && patient.disablity && <span> | </span>}
      {patient.disablity && <span>Disability</span>}
    </div>
  )}

  {/* Date of Registration */}
  <p className="text-gray-600">
    {new Date(patient.createdAt || "").toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}
  </p>
</div>

        
    
      </div>
    </div>
  );
};

export default UserComponent;
