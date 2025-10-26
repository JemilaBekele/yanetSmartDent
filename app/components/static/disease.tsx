"use client";

import { useState, useMemo } from "react";
import axios from "axios";
import DataTable from "@/app/components/ui/TableComponent";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface DiseaseStat {
  _id: string; // Disease name
  stats: {
    gender: string;
    ageGroup: string;
    count: number;
  }[];
}

const DiseaseStatistics = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [statistics, setStatistics] = useState<DiseaseStat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

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
      const response = await axios.post("/api/statics/disease", {
        startDate,
        endDate,
      });

      if (response.data.success) {
        setStatistics(response.data.data);
        console.log("Fetched data:", response.data.data);
      } else {
        setErrorMessage(response.data.message || "Failed to fetch data.");
      }
    } catch (error: any) {
      console.error("Error fetching statistics:", error);
      setErrorMessage(
        error.response?.data?.message || 
        "Failed to fetch data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (statistics.length === 0) {
      alert("No data available for export.");
      return;
    }

    // Define all possible age groups
    const ageGroups = ["<1", "1-4", "5-14", "15-29", "30-64", "65+", "Unknown"];
    const genders = ["Male", "Female"];

    // Create header row
    const headerRow = ["Disease Name"];
    genders.forEach(gender => {
      ageGroups.forEach(ageGroup => {
        headerRow.push(`${gender}, ${ageGroup}`);
      });
    });

    // Prepare data for Excel
    const excelData = statistics.map((disease) => {
      const row: any = { "Disease Name": disease._id };

      // Initialize all gender-age combinations to 0
      genders.forEach(gender => {
        ageGroups.forEach(ageGroup => {
          const key = `${gender}, ${ageGroup}`;
          row[key] = 0;
        });
      });

      // Fill in actual counts
      disease.stats.forEach((stat) => {
        const gender = stat.gender.charAt(0).toUpperCase() + stat.gender.slice(1);
        const key = `${gender}, ${stat.ageGroup}`;
        if (row.hasOwnProperty(key)) {
          row[key] = stat.count;
        }
      });

      return row;
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Disease Statistics");

    // Auto-size columns
    const maxWidth = headerRow.reduce((max, header) => {
      return Math.max(max, header.length);
    }, 0);
    worksheet['!cols'] = [{ wch: maxWidth + 2 }];

    // Export to Excel file
    XLSX.writeFile(workbook, `Disease_Statistics_${startDate}_to_${endDate}.xlsx`);
  };

  // Calculate total counts for summary
  const totalCounts = useMemo(() => {
    let total = 0;
    statistics.forEach(disease => {
      disease.stats.forEach(stat => {
        total += stat.count;
      });
    });
    return total;
  }, [statistics]);

  // Get unique diseases count
  const uniqueDiseasesCount = statistics.length;

  return (
    <div className="flex mt-7">
      <div className="flex-grow md:ml-60 container mx-auto px-4">
        {/* Navigation Buttons */}
        <div className="mt-11 mb-6 flex flex-wrap gap-2">
          {["admin"].includes(role) && (
            <a href={`/${role}/Disease/all`} className="inline-block">
              <Button type="button" className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                All Disease
              </Button>
            </a>
          )}
          <a href={`/${role}/gender`} className="inline-block">
            <Button type="button" className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
              Gender Static
            </Button>
          </a>
        </div>

        {/* Main Content */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Disease Statistics Report
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Filtered by your branch access
          </p>

          {/* Date Filter Form */}
          <form onSubmit={handleFetchStatistics} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-md w-full p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-600 text-white rounded-md py-2 px-6 w-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "Fetch Statistics"}
                </button>
              </div>
            </div>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errorMessage}
            </div>
          )}

          {/* Summary Statistics */}
          {statistics.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{uniqueDiseasesCount}</div>
                <div className="text-blue-600">Unique Diseases</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{totalCounts}</div>
                <div className="text-green-600">Total Cases</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                </div>
                <div className="text-purple-600">Date Range</div>
              </div>
            </div>
          )}

          {/* Statistics Display */}
          {statistics.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Disease Breakdown
                </h2>
                <Button
                  onClick={handleExportToExcel}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Export to Excel
                </Button>
              </div>

              {statistics.map((disease) => {
                const diseaseTotal = disease.stats.reduce((sum, stat) => sum + stat.count, 0);
                
                return (
                  <div key={disease._id} className="mb-8 border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg text-gray-800">{disease._id}</h3>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Total: {diseaseTotal} cases
                      </span>
                    </div>
                    <DataTable
                      data={disease.stats}
                      columns={[
                        {
                          key: "gender",
                          header: "Gender",
                          render: (stat) => (
                            <span className="capitalize">{stat.gender}</span>
                          ),
                        },
                        {
                          key: "ageGroup",
                          header: "Age Group",
                          render: (stat) => stat.ageGroup,
                        },
                        {
                          key: "count",
                          header: "Count",
                          render: (stat) => (
                            <span className="font-semibold">{stat.count}</span>
                          ),
                        },
                      ]}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {statistics.length === 0 && !loading && !errorMessage && (
            <div className="text-center py-8 text-gray-500">
              <p>Select a date range and fetch statistics to view disease data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseStatistics;