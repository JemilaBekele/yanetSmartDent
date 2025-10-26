"use client";

import { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useSession } from 'next-auth/react';

type OrganizationInfo = {
  _id: string;
  organization: string;
  createdBy?: {
    username: string;
  };
  createdAt: string;
};

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const OrganizationPage: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId = params.id;
  const { data: session } = useSession(); // Get session data
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo[]>([]);
  const [existingOrganizations, setExistingOrganizations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationInfo | null>(null);
  const [editOrganization, setEditOrganization] = useState<string | null>(null);
  const role = useMemo(() => session?.user?.role || '', [session]); // Derive role

  useEffect(() => {
    const fetchOrganizationInfo = async () => {
      setError(null);
      try {
        const response = await fetch(`/api/Orgnazation/${patientId}`, {
          method: "GET",
        });
        const data = await response.json();
        if (response.ok) {
          setOrganizationInfo(data.data || []);
        } else {
          setError(data.error || "Error fetching organization information");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
      }
    };

    const fetchOrganizations = async () => {
      try {
        const response = await axios.get('/api/Orgnazation/findall');
        if (response.status === 200) {
          const orgData = response.data.data;

          // Use a Set to filter unique organization names
          const uniqueOrganizations : string[]  = Array.from(
            new Set(orgData.map((org: { organization: string }) => org.organization))
          );

          setExistingOrganizations(uniqueOrganizations);
        } else {
          console.error('Error fetching organizations:', response.statusText);
          setError("Error fetching organizations");
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError("Error fetching organizations");
      }
    };

    fetchOrganizationInfo();
    fetchOrganizations();
  }, [patientId]);

  const handleEdit = (organization: OrganizationInfo) => {
    setSelectedOrganization(organization);
    setEditOrganization(organization.organization);
  };

  const handleDeleteConfirmation = (recordId: string) => {
    if (!recordId) {
      console.error("No organization ID provided for deletion");
      return;
    }
    const toastId = toast.warn(
      <div>
        <span>Are you sure you want to delete this organization?</span>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded-md"
            onClick={() => {
              handleDelete(recordId);
              toast.dismiss(toastId); // Dismiss specific toast by ID
            }}
          >
            Yes
          </button>
          <button
            className="bg-gray-300 text-black px-3 py-1 rounded-md"
            onClick={() => toast.dismiss(toastId)}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDelete = async (recordId: string) => {
    if (!recordId) {
      console.error("No organization ID provided for deletion");
      return;
    }
    try {
      const response = await axios.delete(`/api/Orgnazation/delete/${patientId}`, {
        data: { recordId },
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setOrganizationInfo((prevOrganizations) =>
          prevOrganizations.filter((org) => org._id !== recordId)
        );
        toast.success("Organization deleted successfully!");
      } else {
        toast.error(response.data.error || "Error deleting organization");
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      toast.error("An unexpected error occurred while deleting the record.");
    }
  };

  const handleUpdateOrganization = async () => {
    if (selectedOrganization && editOrganization !== null) {
      try {
        const payload = { recordId: selectedOrganization._id, organization: editOrganization };
        const response = await axios.patch(`/api/Orgnazation/all/${selectedOrganization._id}`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.data.success) {
          setOrganizationInfo((prevOrganizations) =>
            prevOrganizations.map((info) =>
              info._id === selectedOrganization._id ? { ...info, organization: editOrganization } : info
            )
          );
          toast.success("Organization updated successfully!");
          setSelectedOrganization(null);
        } else {
          toast.error(response.data.error || "Error updating organization");
        }
      } catch (err) {
        console.error("Error updating organization:", err);
        toast.error("An unexpected error occurred while updating the organization.");
      }
    }
  };
  const [isVisible,] = useState(false)

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Organization Information</h1>
              {role === 'admin' && (
                <Link
                  href={`/admin/organization/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Organization +
                </Link>
              )}
              {role === 'reception' && (
                <Link
                  href={`/reception/organization/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Organization +
                </Link>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="space-y-4">
              {organizationInfo.length > 0 ? (
                organizationInfo.map((info) => (
                  <div key={info._id} className="p-4 bg-gray-50 rounded-lg shadow-xl">
                    <h3 className="font-semibold">Organization: {info.organization}</h3>
                    <p className="font-semibold">
                      Date: {new Date(info.createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex justify-start space-x-4 mt-4">
                    {isVisible && (
        <button
          className="hover:bg-blue-300 p-2 rounded-full"
          onClick={() => handleEdit(info)}
          aria-label="Edit organization"
          title="Edit organization"
        >
          <EditOutlined className="text-xl text-blue-500" />
        </button>
      )}
                      <button
                        className="hover:bg-red-300 p-2 rounded-full"
                        onClick={() => handleDeleteConfirmation(info._id)}
                        aria-label="Delete organization"
                        title="Delete organization"
                      >
                        <DeleteOutlined className="text-xl text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No organization information available.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedOrganization && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Edit Organization</h2>
            <label className="block text-sm font-medium text-gray-700">Organization</label>
            <select
              value={editOrganization || ""}
              onChange={(e) => setEditOrganization(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            >
              <option value="">Select an existing organization or add a new one</option>
              {existingOrganizations.map((org, index) => (
                <option key={index} value={org}>
                  {org}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or add a new organization"
              value={editOrganization || ""}
              onChange={(e) => setEditOrganization(e.target.value)}
              className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
            <div className="mt-4 flex justify-end space-x-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                onClick={handleUpdateOrganization}
              >
                Save
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={() => setSelectedOrganization(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default OrganizationPage;