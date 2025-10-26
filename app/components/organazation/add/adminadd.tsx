"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import EditOrganizationModal from "./edit";

type Organization = {
  id?: string;
  organization: string;
};

type ApiOrganization = {
  _id: string;
  organization: string;
};

const OrganizationManagement = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [organizationData, setOrganizationData] = useState<Organization>({ organization: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get("/api/app/org");

      console.log("Fetched organizations:", response.data);

      if (response.data && Array.isArray(response.data.data)) {
        const normalizedData = response.data.data.map((org: ApiOrganization) => ({
          id: org._id,
          organization: org.organization,
        }));
        setOrganizations(normalizedData);
      } else {
        console.error("Unexpected API response format:", response.data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrganizationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/Orgnazation/findall", organizationData);
      if (response.status === 201) {
        setMessage("Organization added successfully!");
        setOrganizationData({ organization: "" });

        // Refetch organizations to update the list
        await fetchOrganizations();
      } else {
        setMessage("Failed to add organization.");
      }
    } catch (error) {
      setMessage("Error adding organization.");
      console.error(error);
    }
  };

  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization);
    setIsEditOpen(true);
  };

  const handleUpdate = async (data: Organization) => {
    if (!data.id) return;
    try {
      const payload = { recordId: data.id, organization: data.organization };
      const response = await axios.patch(`/api/Orgnazation/all/${data.id}`, payload);

      if (response.status === 200 && response.data.organization) {
        // Update the organizations state with the new data
        setOrganizations((prev) =>
          prev.map((org) =>
            org.id === data.id ? { ...org, organization: response.data.organization } : org
          )
        );
        setMessage("Organization updated successfully!");
      } else {
        setMessage("Organization updated organization.");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      setMessage("Error updating organization.");
    } finally {
      setIsEditOpen(false);
      setSelectedOrganization(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    const recordId = id;
    if (confirm("Are you sure you want to delete this organization?")) {
      setLoading(true);
      try {
        const response = await axios.delete(`/api/Orgnazation/all/${id}`, {
          data: { recordId },
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          setOrganizations((prev) => prev.filter((org) => org.id !== id));
          setMessage("Organization deleted successfully!");
        } else {
          setMessage("Failed to delete organization.");
        }
      } catch (error) {
        console.error("Error deleting organization:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-gray-100 p-5 rounded-lg mt-20 w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Organization Management</h1>
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add New Organization</h2>
        {message && <p className="mb-4 text-green-500">{message}</p>}
        <form onSubmit={handleAddOrganization} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organization Name</label>
            <input
              type="text"
              name="organization"
              value={organizationData.organization}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700">
              Add Organization
            </button>
          </div>
        </form>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-4">Organization Name</th>
            <th className="p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {organizations?.length > 0 ? (
            organizations.map((org) => (
              org && (
                <tr key={org.id} className="border-t">
                  <td className="p-4">{org.organization ?? "N/A"}</td>
                  <td className="p-4">
                    <button onClick={() => handleEdit(org)} className="text-blue-500 hover:underline mr-4">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(org.id)} className="text-red-500 hover:underline" disabled={loading}>
                      Delete
                    </button>
                  </td>
                </tr>
              )
            ))
          ) : (
            <tr>
              <td colSpan={2} className="p-4 text-center text-gray-500">No organizations found</td>
            </tr>
          )}
        </tbody>
      </table>

      <EditOrganizationModal isOpen={isEditOpen} formData={selectedOrganization} onClose={() => setIsEditOpen(false)} onUpdate={handleUpdate} />
    </div>
  );
};

export default OrganizationManagement;