"use client";

import { useState, useEffect } from "react";
import DataTable from "@/app/components/ui/TableComponent";
import axios from "axios";

interface Doctor {
  _id: string;
  username: string;
}

interface Branch {
  _id: string;
  name: string;
}

interface ServiceStat {
  _id: string;
  serviceName: string;
  totalUsageCount: number;
  totalRevenue: number;
}

interface BranchStat {
  branchId: string;
  branchName: string;
  services: ServiceStat[];
  totalRevenue: number;
  totalUsage: number;
}

const FetchStatic = () => {
  const [createdBy, setCreatedBy] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rankByUsage, setRankByUsage] = useState<ServiceStat[]>([]);
  const [rankByRevenue, setRankByRevenue] = useState<ServiceStat[]>([]);
  const [branchStats, setBranchStats] = useState<BranchStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overall" | "branch">("overall");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get("/api/Doctor/alldock");
        if (response.data && Array.isArray(response.data)) {
          setDoctors(response.data);
        } else {
          console.error("Invalid doctor data format");
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
    };

    const fetchBranches = async () => {
      try {
        const response = await axios.get("/api/Branch");
        if (response.data && Array.isArray(response.data)) {
          setBranches(response.data);
        } else {
          console.error("Invalid branch data format");
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchDoctors();
    fetchBranches();
  }, []);

  const handleFetchTransactions = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    if (!createdBy && (!startDate || !endDate)) {
      setErrorMessage("Either a doctor or both start and end dates are required.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/statics/rankservice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          createdBy,
          startDate,
          endDate,
          branchId: branchId || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setRankByUsage(data.data.rankByUsage || []);
        setRankByRevenue(data.data.rankByRevenue || []);
        setBranchStats(data.data.branchStats || []);
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "Failed to fetch statistics.");
        setRankByUsage([]);
        setRankByRevenue([]);
        setBranchStats([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setErrorMessage("Failed to fetch transactions. Please try again.");
      setRankByUsage([]);
      setRankByRevenue([]);
      setBranchStats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchOverallStats = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const url = branchId 
        ? `/api/service-statistics?branchId=${branchId}`
        : '/api/service-statistics';

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setRankByUsage(data.data.rankByUsage || []);
        setRankByRevenue(data.data.rankByRevenue || []);
        setBranchStats(data.data.branchStats || []);
        setActiveTab("overall");
        setErrorMessage("");
      } else {
        setErrorMessage(data.message || "Failed to fetch overall statistics.");
      }
    } catch (error) {
      console.error("Error fetching overall statistics:", error);
      setErrorMessage("Failed to fetch overall statistics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setCreatedBy("");
    setStartDate("");
    setEndDate("");
    setBranchId("");
    setRankByUsage([]);
    setRankByRevenue([]);
    setBranchStats([]);
    setErrorMessage("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const totalRevenue = rankByRevenue.reduce((sum, stat) => sum + stat.totalRevenue, 0);
  const totalUsage = rankByUsage.reduce((sum, stat) => sum + stat.totalUsageCount, 0);

  return (
    <div className="flex mt-7">
      <div className="flex-grow md:ml-60 container mx-auto px-4">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Service Statistics Dashboard</h1>
              <p className="text-blue-100 opacity-90">Track service performance across doctors and branches</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-4">
              <div className="bg-blue-500 px-4 py-2 rounded-lg inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Services: {rankByUsage.length}</span>
              </div>
              {totalRevenue > 0 && (
                <div className="bg-green-500 px-4 py-2 rounded-lg inline-flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span>Revenue: {formatCurrency(totalRevenue)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Doctor and Branch Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter by Professional</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                    Doctor
                  </label>
                  <select
                    id="doctor"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                  >
                    <option value="">All Doctors</option>
                    {doctors.map((doctor) => (
                      <option key={doctor._id} value={doctor._id}>
                        Dr. {doctor.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <select
                    id="branch"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-between">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleFetchOverallStats}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {isLoading ? "Loading..." : "Overall Stats"}
              </button>
              
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                Clear Filters
              </button>
            </div>
            
            <button
              type="button"
              onClick={handleFetchTransactions}
              disabled={isLoading}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isLoading ? "Fetching..." : "Filter Statistics"}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(rankByUsage.length > 0 || rankByRevenue.length > 0 || branchStats.length > 0) && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("overall")}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === "overall"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Overall Statistics
                </button>
                {branchStats.length > 0 && (
                  <button
                    onClick={() => setActiveTab("branch")}
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === "branch"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Branch Breakdown
                  </button>
                )}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overall" && (
                <div className="space-y-8">
                  {/* Rank by Revenue */}
                  {rankByRevenue.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Top Services by Revenue
                      </h2>
                      <DataTable
                        data={rankByRevenue}
                        columns={[
                          {
                            key: "serviceName",
                            header: "Service Name",
                            render: (stat: ServiceStat) => (
                              <span className="font-medium text-gray-900">{stat.serviceName}</span>
                            ),
                          },
                          {
                            key: "totalRevenue",
                            header: "Total Revenue",
                            render: (stat: ServiceStat) => (
                              <span className="font-semibold text-green-600">
                                {formatCurrency(stat.totalRevenue)}
                              </span>
                            ),
                          },
                          {
                            key: "totalUsageCount",
                            header: "Usage Count",
                            render: (stat: ServiceStat) => stat.totalUsageCount.toLocaleString(),
                          },
                        ]}
                      />
                    </div>
                  )}

                  {/* Rank by Usage */}
                  {rankByUsage.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Top Services by Usage
                      </h2>
                      <DataTable
                        data={rankByUsage}
                        columns={[
                          {
                            key: "serviceName",
                            header: "Service Name",
                            render: (stat: ServiceStat) => (
                              <span className="font-medium text-gray-900">{stat.serviceName}</span>
                            ),
                          },
                          {
                            key: "totalUsageCount",
                            header: "Usage Count",
                            render: (stat: ServiceStat) => (
                              <span className="font-semibold text-blue-600">
                                {stat.totalUsageCount.toLocaleString()}
                              </span>
                            ),
                          },
                          {
                            key: "totalRevenue",
                            header: "Total Revenue",
                            render: (stat: ServiceStat) => formatCurrency(stat.totalRevenue),
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === "branch" && branchStats.length > 0 && (
                <div className="space-y-8">
                  {branchStats.map((branch) => (
                    <div key={branch.branchId} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{branch.branchName}</h3>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            Usage: {branch.totalUsage.toLocaleString()}
                          </span>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                            Revenue: {formatCurrency(branch.totalRevenue)}
                          </span>
                        </div>
                      </div>
                      <DataTable
                        data={branch.services}
                        columns={[
                          {
                            key: "serviceName",
                            header: "Service Name",
                            render: (stat: ServiceStat) => stat.serviceName,
                          },
                          {
                            key: "totalUsageCount",
                            header: "Usage Count",
                            render: (stat: ServiceStat) => stat.totalUsageCount.toLocaleString(),
                          },
                          {
                            key: "totalRevenue",
                            header: "Revenue",
                            render: (stat: ServiceStat) => formatCurrency(stat.totalRevenue),
                          },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && rankByUsage.length === 0 && rankByRevenue.length === 0 && branchStats.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Statistics Found</h3>
            <p className="text-gray-600 mb-6">Apply filters and fetch statistics to see service performance data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FetchStatic;