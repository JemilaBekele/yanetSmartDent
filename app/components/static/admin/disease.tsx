"use client";

import { useState, useMemo, useEffect } from "react";
import axios from "axios";
import DataTable from "@/app/components/ui/TableComponent";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface Branch {
  _id: string;
  name: string;
  // Add other branch properties as needed
}

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
  const [selectedBranch, setSelectedBranch] = useState<string>(""); // For single branch selection
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [statistics, setStatistics] = useState<DiseaseStat[]>([]);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Fetch branches on component mount
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/Branch");
      if (response.status === 200) {
        setBranches(response.data);
      } else {
        setErrorMessage("Error fetching branches");
      }
    } catch (err) {
      setErrorMessage("Error fetching branches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

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

      // Only add branchId to request if a branch is selected
      if (selectedBranch) {
        requestData.branchId = selectedBranch;
      }

      const response = await axios.post("/api/statics/disease/admin", requestData);

      if (response.data.success) {
        setStatistics(response.data.data);
        console.log(response.data.data);
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

    // Define header row based on the format
    const headerRow = [
      "Disease Name",
      "Male, <1 year",
      "Male, 1-4 years",
      "Male, 5-14 years",
      "Male, 15-29 years",
      "Male, 30-64 years",
      "Female, <1 year",
      "Female, 1-4 years",
      "Female, 5-14 years",
      "Female, 15-29 years",
      "Female, 30-64 years",
    ];

    type DiseaseRow = {
      [key: string]: string | number;
    };

    const excelData: DiseaseRow[] = [];

    statistics.forEach((disease) => {
      // Initialize a row for the current disease
      const diseaseRow: DiseaseRow = {
        "Disease Name": disease._id,
        "Male, <1 year": 0,
        "Male, 1-4 years": 0,
        "Male, 5-14 years": 0,
        "Male, 15-29 years": 0,
        "Male, 30-64 years": 0,
        "Female, <1 year": 0,
        "Female, 1-4 years": 0,
        "Female, 5-14 years": 0,
        "Female, 15-29 years": 0,
        "Female, 30-64 years": 0,
      };

      disease.stats.forEach((stat) => {
        // Format ageGroup to match keys in diseaseRow
        const formattedAgeGroup =
          stat.ageGroup === "<1" ? "<1 year" : `${stat.ageGroup} years`;

        // Construct the column key
        const columnKey = `${stat.gender.charAt(0).toUpperCase() + stat.gender.slice(1)}, ${formattedAgeGroup}`;

        // Assign the count to the correct column if it exists
        if (diseaseRow[columnKey] !== undefined) {
          diseaseRow[columnKey] = stat.count;
        } else {
          console.warn(`Column key not found in diseaseRow: ${columnKey}`);
        }
      });

      console.log("Updated Row:", diseaseRow);
      excelData.push(diseaseRow);
    });

    console.log("Final Excel Data:", excelData);

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headerRow });
    const workbook = XLSX.utils.book_new();
    
    // Add branch info to sheet name if selected
    const selectedBranchName = selectedBranch 
      ? branches.find(b => b._id === selectedBranch)?.name || 'Selected Branch'
      : 'All Branches';
    
    XLSX.utils.book_append_sheet(workbook, worksheet, `Disease Statistics - ${selectedBranchName}`);

    // Export to Excel file
    XLSX.writeFile(workbook, `Disease_Statistics_${selectedBranchName.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="flex mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        {["admin"].includes(role) && (
          <a
            href={`/${role}/Disease/all`}
            className="mt-5 py-2 px-4 inline-block"
          >
            <Button type="button" className="bg-gray-300 px-4 py-2 rounded">
              All Disease
            </Button>
          </a>
        )}
        <a
          href={`/${role}/gender`}
          className="mt-5 py-2 px-4 inline-block"
        >
          <Button type="button" className="bg-gray-300 px-4 py-2 rounded">
            Gender Static
          </Button>
        </a>

        <div className="p-6 bg-white rounded shadow-md">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Disease Statistics Report
          </h1>
          
          <form onSubmit={handleFetchStatistics} className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block mb-1 font-medium">
                  Start Date:
                </label>
                <input
                  type="date"
                  className="border rounded-md w-full p-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block mb-1 font-medium">
                  End Date:
                </label>
                <input
                  type="date"
                  className="border rounded-md w-full p-2"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="branch" className="block mb-1 font-medium">
                  Branch (Optional):
                </label>
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
              className="bg-gray-500 text-white rounded-md py-2 px-4 hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              {loading ? "Fetching..." : "Fetch Statistics"}
            </button>
          </form>

          {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}

          {/* Render Statistics */}
          {statistics.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <p className="text-blue-800">
                  Showing data for: <strong>
                    {selectedBranch 
                      ? branches.find(b => b._id === selectedBranch)?.name || 'Selected Branch'
                      : 'All Branches'
                    }
                  </strong>
                </p>
                <p className="text-blue-800">
                  Period: <strong>{startDate}</strong> to <strong>{endDate}</strong>
                </p>
              </div>

              {statistics.map((disease) => (
                <div key={disease._id} className="mb-6">
                  <h2 className="font-bold text-xl mb-2">{disease._id}</h2>
                  <DataTable
                    data={disease.stats}
                    columns={[
                      {
                        key: "gender",
                        header: "Gender",
                        render: (stat) => stat.gender,
                      },
                      {
                        key: "ageGroup",
                        header: "Age Group",
                        render: (stat) => stat.ageGroup,
                      },
                      {
                        key: "count",
                        header: "Count",
                        render: (stat) => stat.count,
                      },
                    ]}
                  />
                </div>
              ))}
              
              <button
                className="bg-green-500 text-white mt-4 py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
                onClick={handleExportToExcel}
              >
                Export to Excel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseStatistics;