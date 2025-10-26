"use client";

import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import axios from 'axios';

interface CustomerName {
  id: {
    firstname: string;
  };
}

interface CreatedBy {
  id: {
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

interface Credit {
  _id: string;
  customerName?: CustomerName;
  totalAmount: number;
  status: string;
  currentPayment: {
    amount: number;
    confirm: boolean;
  };
  createdBy?: CreatedBy;
}

const FilterCredits: NextPage = () => {
  const [createdBy, setCreatedBy] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [organization, setOrganization] = useState<string>('');
  const [credits, setCredits] = useState<Credit[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [, setErrorMessage] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [selectedCredits, setSelectedCredits] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctors();
    fetchOrganizations();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/api/patient/doctor');
      if (response.status === 200) {
        setDoctors(response.data);
      } else {
        console.error('Error fetching doctors:', response.statusText);
        setErrorMessage('Error fetching doctors');
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setErrorMessage('Error fetching doctors');
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('/api/Orgnazation/findall');
      console.log(response.data);
      if (response.status === 200) {
        const orgData = response.data.data;

        // Use a Set to filter unique organization names
        const uniqueOrganizations = Array.from(
          new Set(orgData.map((org: { organization: string }) => org.organization))
        ).map((uniqueOrgName) =>
          orgData.find((org: { organization: string }) => org.organization === uniqueOrgName)
        );

        setOrganizations(Array.isArray(uniqueOrganizations) ? uniqueOrganizations : []);
      } else {
        console.error('Error fetching organizations:', response.statusText);
        setErrorMessage('Error fetching organizations');
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setErrorMessage('Error fetching organizations');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const requestData = {
      createdBy,
      creditDate: { start: startDate, end: endDate },
      organization,
      status,
    };

    try {
      const response = await axios.post('/api/Creadit/report', requestData);
      console.log(response)
      console.log(response.data)
      if (response.status === 200) {
        setCredits(response.data);
        const total = response.data.reduce((sum: number, credit: Credit) => sum + credit.currentPayment.amount, 0);
        setTotalAmount(total);
      } else {
        console.error('Error fetching credits:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAsPaid = async (creditId: string) => {
    const credit = credits.find((c) => c._id === creditId);

    if (!credit) {
      console.error('Credit not found');
      return;
    }

    const paymentAmount = credit.currentPayment.amount;

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      console.error('Invalid payment amount');
      return;
    }

    try {
      const response = await axios.patch(`/api/Creadit/confirm/${creditId}`, {
        CreditId: creditId,
        currentPayment: paymentAmount,
      });
      if (response.status === 200) {
        setCredits((prevCredits) =>
          prevCredits.map((credit) =>
            credit._id === creditId
              ? { ...credit, status: 'Paid', currentPayment: { ...credit.currentPayment, confirm: true } }
              : credit
          )
        );
      } else {
        console.error('Error updating credit status:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSelectCredit = (creditId: string) => {
    setSelectedCredits((prevSelected) =>
      prevSelected.includes(creditId)
        ? prevSelected.filter((id) => id !== creditId)
        : [...prevSelected, creditId]
    );
  };

  const handleMarkSelectedAsPaid = async () => {
    try {
      const creditsToUpdate = selectedCredits
        .map((creditId) => {
          const credit = credits.find((c) => c._id === creditId);
          return credit && credit.currentPayment.amount > 0
            ? { creditId, paymentAmount: credit.currentPayment.amount }
            : null;
        })
        .filter(Boolean);

      if (creditsToUpdate.length > 0) {
        await axios.patch('/api/Creadit/confirm', { creditsToUpdate });
        setCredits((prevCredits) =>
          prevCredits.map((credit) =>
            selectedCredits.includes(credit._id)
              ? { ...credit, status: 'Paid', currentPayment: { ...credit.currentPayment, confirm: true } }
              : credit
          )
        );
        setSelectedCredits([]);
      }
    } catch (error) {
      console.error('Error updating selected credits:', error);
    }
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
                <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                  Doctor Name:
                </label>
                <select
                  id="doctor"
                  name="doctor"
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
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                  Organization:
                </label>
                <select
                  id="organization"
                  name="organization"
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
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Filter
              </button>
            </form>

            <div className="mt-8">
              
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-gray-200 text-gray-700">
                    <th className="p-2">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedCredits(e.target.checked ? credits.map((credit) => credit._id) : [])
                        }
                        checked={selectedCredits.length === credits.length && credits.length > 0}
                      />
                    </th>
                    <th className="p-2">Customer Name</th>
                    <th className="p-2">Total Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Created By</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((credit, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedCredits.includes(credit._id)}
                          onChange={() => handleSelectCredit(credit._id)}
                        />
                      </td>
                      <td className="p-2">
  {credit.customerName?.id?.firstname || 'No Name Available'}
</td>

                      <td className="p-2">{credit.currentPayment.amount}</td>
                      <td className="p-2">{credit.status}</td>
                      <td className="p-2">{credit.createdBy?.id?.username ?? ''}</td>
                      <td className="p-2">
                        {credit.status !== 'Paid' && (
                          <button
                            onClick={() => handleMarkAsPaid(credit._id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedCredits.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={handleMarkSelectedAsPaid}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    Mark Selected as Paid
                  </button>
                </div>
              )}

<h2 className="text-xl font-semibold text-gray-800 mb-4">Results</h2>
<p className="text-lg font-semibold text-gray-800 mb-4">Total: {totalAmount}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FilterCredits;