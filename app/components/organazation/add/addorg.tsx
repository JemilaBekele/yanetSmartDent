"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from 'next-auth/react';

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const CreateOrgnazationPage: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId = params.id;
  const { data: session } = useSession();  // Patient ID from URL
  const [organization, setOrganization] = useState<string>("");
  const [existingOrganizations, setExistingOrganizations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const role = useMemo(() => session?.user?.role || '', [session]);

  // Fetch existing organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/Orgnazation/findall');
        const data = await response.json();
        if (response.ok) {
          const organizationNames: string[] = Array.from(new Set(data.data.map((org: { organization: string }) => org.organization)));
          setExistingOrganizations(organizationNames);
        } else {
          console.error('Failed to fetch organizations');
        }
      } catch (error) {
        console.error('An error occurred while fetching organizations:', error);
      }
    };

    fetchOrganizations();
  }, []);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/Orgnazation/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organization }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Organization created successfully!");
        setOrganization(""); // Reset organization field
        // Redirect based on user role
        if (role === 'admin') {
          router.push(`/admin/organization/all/${patientId}`);
        } else if (role === 'reception') {
          router.push(`/reception/organization/all/${patientId}`);
        }
      } else {
        setError(data.error || "Error creating organization");
      }
    } catch (err) {
      setError("An error occurred");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Details */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Create Organization</h1>
            </div>
            {/* Success and Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}
            {message && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
                <strong>Success:</strong> {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization:
                </label>
                <select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select an existing organization or add a new one</option>
                  {existingOrganizations.map((org, index) => (
                    <option key={index} value={org}>{org}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Or add a new organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  required
                  readOnly
                  className="mt-2 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrgnazationPage;