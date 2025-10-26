"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import DataTable from "@/app/components/ui/TableComponent";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { DownloadOutlined, FilterOutlined, InfoCircleOutlined } from '@ant-design/icons';
import Spinner from '@/app/components/ui/Spinner';

interface PatientStat {
  gender: string;
  ageGroups: {
    ageGroup: string;
    count: number;
  }[];
  total: number;
}

interface Branch {
  _id: string;
  name: string;
  location: string;
  phone: string;
}

const PatientStatistics = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [statistics, setStatistics] = useState<PatientStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showAllBranches, setShowAllBranches] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleFetchStatistics = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    if (!startDate || !endDate) {
      setErrorMessage("Both start date and end date are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/statics/disease/age", {
        startDate,
        endDate,
        showAll: showAllBranches
      });

      if (response.data.success) {
        setStatistics(response.data.data);
        setCurrentBranch(response.data.userBranch || null);
      } else {
        setErrorMessage(response.data.message || "Invalid data.");
      }
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      setErrorMessage(error.response?.data?.message || "Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = async () => {
    if (statistics.length === 0) {
      alert("No data available for export.");
      return;
    }

    setExportLoading(true);
    try {
      // Define header row
      const headerRow = [
        "Gender",
        "<5 years",
        "5-10 years",
        "11-19 years",
        "20-29 years",
        "30-45 years",
        "46-65 years",
        "66+ years",
        "Total"
      ];

      const excelData = statistics.map(stat => {
        const row: Record<string, string | number> = {
          "Gender": stat.gender.charAt(0).toUpperCase() + stat.gender.slice(1)
        };

        // Initialize all age groups with 0
        const ageGroups = ["<5", "5-10", "11-19", "20-29", "30-45", "46-65", "66+"];
        ageGroups.forEach(group => {
          row[`${group} years`] = 0;
        });

        // Fill in actual counts
        stat.ageGroups.forEach(ageGroup => {
          const key = `${ageGroup.ageGroup}${ageGroup.ageGroup.includes('+') ? '' : ' years'}`;
          if (row[key] !== undefined) {
            row[key] = ageGroup.count;
          }
        });

        row["Total"] = stat.total;

        return row;
      });

      // Add branch info to filename if filtered
      const branchSuffix = currentBranch ? `_${currentBranch.name.replace(/\s+/g, '_')}` : '';
      const fileName = `Patient_Statistics${branchSuffix}_${startDate}_to_${endDate}.xlsx`;

      // Create worksheet and workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headerRow });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Patient Statistics");

      // Export to Excel file
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Error exporting data to Excel. Please try again.");
    } finally {
      setExportLoading(false);
    }
  };

  const getTotalPatients = () => {
    return statistics.reduce((total, stat) => total + stat.total, 0);
  };

  const getGenderStats = (gender: string) => {
    const stat = statistics.find(s => s.gender === gender);
    return stat ? stat.total : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-white shadow-sm border-b border-gray-200 p-4 fixed top-0 left-0 right-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold text-slate-800">Age Statistics</h1>
                <p className="text-xs text-slate-600">Patient Report</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`pt-${isMobile ? '20' : '4'} pb-6 px-3 sm:px-4 md:px-6 ${isMobile ? '' : 'md:ml-60'}`}>
        
        {/* Desktop Header Section */}
        {!isMobile && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">Patient Age Statistics Report</h1>
                <p className="text-sm sm:text-base text-slate-600">View patient statistics by age groups and gender</p>
              </div>
              
              {["admin"].includes(role) && (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <a
                    href={`/${role}/patient/all`}
                    className="inline-block"
                  >
                    <Button type="button" className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded text-sm">
                      All Patients
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mt-10 mb-4 sm:mb-6">
          <form onSubmit={handleFetchStatistics}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              {/* Branch Filter for Admin Users */}
              {["admin"].includes(role) && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllBranches}
                      onChange={(e) => setShowAllBranches(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Show All Branches
                  </label>
                </div>
              )}

              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2 px-4 font-medium transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FilterOutlined />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Branch Info */}
          {currentBranch && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <InfoCircleOutlined className="text-blue-600" />
                <span className="text-sm text-blue-800">
                  Showing data for: <strong>{currentBranch.name}</strong>
                  {currentBranch.location && ` - ${currentBranch.location}`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Results */}
        {statistics.length > 0 && (
          <>
            {/* Stats Summary Cards */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                    {getTotalPatients()}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-800">Total Patients</div>
                </div>
                <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                    {getGenderStats('male')}
                  </div>
                  <div className="text-xs sm:text-sm text-green-800">Male Patients</div>
                </div>
                <div className="bg-purple-50 p-3 sm:p-4 rounded-lg border border-purple-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                    {getGenderStats('female')}
                  </div>
                  <div className="text-xs sm:text-sm text-purple-800">Female Patients</div>
                </div>
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">
                    {getGenderStats('none') || 0}
                  </div>
                  <div className="text-xs sm:text-sm text-orange-800">Other</div>
                </div>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2 sm:mb-0">
                  Detailed Age Group Statistics
                </h2>
                <button
                  onClick={handleExportToExcel}
                  disabled={exportLoading}
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                >
                  {exportLoading ? (
                    <>
                      <Spinner />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <DownloadOutlined />
                      Export to Excel
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {statistics.map((stat, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 capitalize">
                        {stat.gender} Patients
                      </h3>
                      <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                        Total: {stat.total}
                      </span>
                    </div>
                    
                    {isMobile ? (
                      // Mobile-friendly table
                      <div className="space-y-2">
                        {stat.ageGroups.map((ageGroup, ageIndex) => (
                          <div key={ageIndex} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="text-sm font-medium text-slate-700">
                              {ageGroup.ageGroup} years
                            </span>
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {ageGroup.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Desktop table
                      <DataTable
                        data={stat.ageGroups}
                        columns={[
                          {
                            key: "ageGroup",
                            header: "Age Group",
                            render: (ageGroup) => (
                              <span className="font-medium text-slate-800">
                                {ageGroup.ageGroup} years
                              </span>
                            ),
                          },
                          {
                            key: "count",
                            header: "Count",
                            render: (ageGroup) => (
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                {ageGroup.count}
                              </span>
                            ),
                          },
                        ]}
                        caption={`Age distribution for ${stat.gender} patients`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && statistics.length === 0 && !errorMessage && (
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
              No Statistics Generated
            </h3>
            <p className="text-slate-600 mb-4 text-sm sm:text-base">
              Select a date range and generate a report to view patient age statistics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientStatistics;