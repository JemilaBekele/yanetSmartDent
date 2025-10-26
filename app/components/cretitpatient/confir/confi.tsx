"use client";

import React, { useState, useEffect } from "react";
import { NextPage } from "next";
import Head from "next/head";
import axios from "axios";

interface Credit {
  _id: string;
  amount: number;
  createdBy: {
    username: string;
    id: string;
  };
  patient: {
    cardno: string;
    firstname: string;
  } | null;
  createdByUser: {
    username: string;
  };
}

interface Doctor {
  _id: string;
  username: string;
}

interface Organization {
  _id: string;
  organization: string;
}

const ConfirmCredits: NextPage = () => {
  const [createdBy, setCreatedBy] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [credits, setCredits] = useState<Credit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctors();
    fetchOrganizations();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get("/api/patient/doctor");
      if (response.status === 200) {
        setDoctors(response.data);
      } else {
        console.error("Error fetching doctors:", response.statusText);
      }
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get("/api/Orgnazation/findall");
      if (response.status === 200) {
        const orgData = response.data.data;

        // Filter unique organizations
        const uniqueOrganizations = Array.from(
          new Set(orgData.map((org: { organization: string }) => org.organization))
        ).map((uniqueOrgName) =>
          orgData.find((org: { organization: string }) => org.organization === uniqueOrgName)
        );

        setOrganizations(Array.isArray(uniqueOrganizations) ? uniqueOrganizations : []);
      } else {
        console.error("Error fetching organizations:", response.statusText);
      }
    } catch (err) {
      console.error("Error fetching organizations:", err);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requestData = {
      createdBy,
      creditDate: { start: startDate, end: endDate },
      organization,
    };

    try {
      const response = await axios.post("/api/Creadit/repoconfirm", requestData);
      if (response.status === 200) {
        setCredits(response.data.data);
        const total = response.data.data.reduce((sum: number, credit: Credit) => sum + credit.amount, 0);
        setTotalAmount(total);
      } else {
        console.error("Error fetching credits:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCredits(e.target.checked ? credits.map((credit) => credit._id) : []);
  };

  const handleSelectOne = (creditId: string) => {
    setSelectedCredits((prev) =>
      prev.includes(creditId) ? prev.filter((id) => id !== creditId) : [...prev, creditId]
    );
  };

  return (
    <>
      <Head>
        <title>Filter Credits</title>
      </Head>
      <div className="flex ml-7 mt-7">
        <div className="flex-grow md:ml-60 container mx-auto">
          <div className="p-6 bg-white rounded shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Filter Credits</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Doctor Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Doctor Name:</label>
                <select
                  className="border rounded-md w-full p-2"
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Organization Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Organization:</label>
                <select
                  className="border rounded-md w-full p-2"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                >
                  <option value="">-- Select Organization --</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.organization}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit Date Range Input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 p-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button type="submit" className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Filter
              </button>
            </form>

            <div className="mt-8">
              <table className="w-full text-left table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-2">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedCredits.length === credits.length && credits.length > 0}
                      />
                    </th>
                    <th className="p-2">Customer Name</th>
                    <th className="p-2">Card Number</th>
                    <th className="p-2">Total Amount</th>
                    <th className="p-2">Created By</th>
                    <th className="p-2">Accept By</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((credit) => (
                    <tr key={credit._id} className="border-b hover:bg-gray-100">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          onChange={() => handleSelectOne(credit._id)}
                          checked={selectedCredits.includes(credit._id)}
                        />
                      </td>
                      <td className="p-2">{credit.patient?.firstname || "No Name"}</td>
                      <td className="p-2">{credit.patient?.cardno || "No Card"}</td>
                      <td className="p-2">{credit?.amount.toLocaleString()} ETB</td>
                      <td className="p-2">{credit.createdByUser?.username || "Unknown"}</td>
                      <td className="p-2">{credit.createdBy?.username || "Unknown"}</td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="text-lg font-semibold mt-4">Total Amount: {totalAmount.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmCredits;
