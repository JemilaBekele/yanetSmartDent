"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import DataTable from "@/app/components/ui/TableComponent";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

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
  location?: string;
  phone?: string;
}

const PatientStatistics = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>(""); // For branch ID
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [statistics, setStatistics] = useState<PatientStat[]>([]);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/Branch");
      if (response.status === 200) {
        setBranches(response.data);
        setErrorMessage("");
      } else {
        setErrorMessage("Error fetching branches");
      }
    } catch (err) {
      setErrorMessage("Error fetching branches");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStatistics = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!startDate || !endDate) {
      setErrorMessage("Both start date and end date are required.");
      return;
    }

    try {
      const requestData: any = {
        startDate,
        endDate,
      };

      // Only include branchId if a branch is selected (not empty string)
      if (selectedBranch) {
        requestData.branchId = selectedBranch;
      }

      const response = await axios.post("/api/statics/disease/admin/age", requestData);

      if (response.data.success) {
        setStatistics(response.data.data);
      } else {
        setErrorMessage(response.data.message || "Invalid data.");
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setErrorMessage("Failed to fetch data. Please try again.");
    }
  };

  const handleExportToExcel = () => {
    if (statistics.length === 0) {
      alert("No data available for export.");
      return;
    }

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

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headerRow });
    const workbook = XLSX.utils.book_new();
    
    // Add branch info to sheet name if a branch is selected
    const selectedBranchName = branches.find(b => b._id === selectedBranch)?.name || "All Branches";
    const sheetName = `Patient Stats - ${selectedBranchName}`.substring(0, 31); // Excel sheet name limit
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Export to Excel file
    const fileName = `Patient_Statistics_${selectedBranchName.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="flex mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        {/* {["admin"].includes(role) && (
          <a
            href={`/${role}/patient/all`}
            className="mt-5 py-2 px-4 inline-block"
          >
            <Button type="button" className="bg-gray-300 px-4 py-2 rounded">All Patients</Button>
          </a>
        )} */}
        <div className="p-6 bg-white rounded shadow-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Patient Statistics Report
          </h1>
          <form onSubmit={handleFetchStatistics} className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block mb-2">Start Date:</label>
                <input
                  type="date"
                  className="border rounded-md w-full p-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block mb-2">End Date:</label>
                <input
                  type="date"
                  className="border rounded-md w-full p-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="branch" className="block mb-2">Branch (Optional):</label>
                <select
                  className="border rounded-md w-full p-2"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
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
            <button 
              type="submit" 
              className="bg-gray-500 text-white rounded-md py-2 px-4 hover:bg-gray-600 transition duration-200"
              disabled={loading}
            >
              {loading ? "Loading..." : "Fetch Statistics"}
            </button>
          </form>
          
          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

          {/* Display selected branch info */}
          {selectedBranch && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-blue-800">
                <strong>Selected Branch:</strong> {branches.find(b => b._id === selectedBranch)?.name}
              </p>
            </div>
          )}

          {/* Render Statistics */}
          {statistics.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <h3 className="font-semibold">Report Summary</h3>
                <p>
                  Period: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  {selectedBranch && ` | Branch: ${branches.find(b => b._id === selectedBranch)?.name}`}
                </p>
              </div>
              
              {statistics.map((stat, index) => (
                <div key={index} className="mb-6">
                  <h2 className="font-bold text-xl">
                    {stat.gender.charAt(0).toUpperCase() + stat.gender.slice(1)} Patients
                  </h2>
                  <p className="mb-2 mt-3">Total: {stat.total}</p>
                  <DataTable
                    data={stat.ageGroups}
                    columns={[
                      {
                        key: "ageGroup",
                        header: "Age Group",
                        render: (ageGroup) => `${ageGroup.ageGroup} years`,
                      },
                      {
                        key: "count",
                        header: "Count",
                        render: (ageGroup) => ageGroup.count,
                      },
                    ]}
                  />
                </div>
              ))}
              
              <div className="flex gap-4 mt-6">
                <button
                  className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition duration-200"
                  onClick={handleExportToExcel}
                >
                  Export to Excel
                </button>
                
                <button
                  className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition duration-200"
                  onClick={() => {
                    setSelectedBranch("");
                    setStatistics([]);
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientStatistics;