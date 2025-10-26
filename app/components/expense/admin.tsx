import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button"; 
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";

// Define the Expense interface
interface Expense {
  _id: string;
  amount: number;
  discription: string;
  branch: {
    _id: string;
    name: string;
  };
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
  };
}

// Define the Branch interface
interface Branch {
  _id: string;
  name: string;
}

const AdminExpenseReport: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [updatedAmount, setUpdatedAmount] = useState<number>(0);
  const [updatedDescription, setUpdatedDescription] = useState<string>("");

  // Fetch branches
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/Branch");
      if (response.status === 200) {
        setBranches(response.data);
        setError(null);
      } else {
        setError("Error fetching branches");
      }
    } catch (err) {
      setError("Error fetching branches");
    } finally {
      setLoading(false);
    }
  };

  // Fetch expenses based on start date, end date, and branch
  const fetchExpenses = useCallback(async () => {
    try {
      const requestBody: any = { startDate, endDate };
      
      // Only add branchId to request if a branch is selected
      if (selectedBranch) {
        requestBody.branchId = selectedBranch;
      }

      console.log('Fetching expenses with:', requestBody);

      const response = await fetch("/api/Expense/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("Failed to fetch expenses");

      const data = await response.json();
      console.log('Expenses response:', data);
      
      if (data.success) {
        setExpenses(data.data.expenses || []);
        setError(null);
      } else {
        setError(data.message || "No data found");
        setExpenses([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setExpenses([]);
    }
  }, [startDate, endDate, selectedBranch]);

  // useEffect to call fetchExpenses whenever filters change
  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchExpenses();
    }
  }, [fetchExpenses]);

  const handleDeleteExpense = async (expenseId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");
    if (!confirmDelete) return;
    try {
      const response = await fetch(`/api/Expense/detail/${expenseId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expeId: expenseId }),
      });

      if (!response.ok) throw new Error("Failed to delete expense");

      setExpenses((prevExpenses) => prevExpenses.filter((exp) => exp._id !== expenseId));
      
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleUpdateExpense = async () => {
    if (!currentExpense) return;

    try {
      const response = await fetch(`/api/Expense/detail/${currentExpense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expeId: currentExpense._id,
          amount: updatedAmount,
          discription: updatedDescription,
        }),
      });

      if (!response.ok) throw new Error("Failed to update expense");

      // Refresh the expense list
      fetchExpenses();
      setIsModalOpen(false); // Close the modal after updating
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const setPresetDates = (range: string) => {
    const today = new Date();
    let start = new Date();
  
    switch (range) {
      case "today":
        // Today remains today
        break;
  
      case "thisWeek":
        // Set start date to the most recent Monday (handle Sunday as 0, adjust accordingly)
        const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
        start.setDate(today.getDate() - daysSinceMonday);
        break;
  
      case "oneMonth":
        // Set start date to the 1st of the current month
        start.setDate(1);
        break;
  
      case "threeMonths":
        // Go back 3 months and reset to the 1st day of that month
        start.setMonth(start.getMonth() - 3);
        start.setDate(1);
        break;
  
      case "sixMonths":
        // Go back 6 months and reset to the 1st day of that month
        start.setMonth(start.getMonth() - 6);
        start.setDate(1);
        break;
  
      case "oneyear":
        // Dynamically set to January 1st of the current year
        start = new Date(today.getFullYear(), 0, 1); // January 1st of the current year
        break;
  
      default:
        return;
    }
  
    // Ensure the dates are formatted as YYYY-MM-DD
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const openModal = (expense: Expense) => {
    setCurrentExpense(expense);
    setUpdatedAmount(expense.amount);
    setUpdatedDescription(expense.discription);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentExpense(null);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedBranch("");
    setExpenses([]);
  };

  return (
    <div className="ml-9 mt-7 lg:ml-60 lg:mt-7 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex-grow md:ml-60 container mx-auto">

        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Expense Report</h1>
              <p className="text-blue-100 opacity-90">Track and manage all expenses</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="bg-blue-500 px-4 py-2 rounded-lg inline-flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Total Expenses: {expenses.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Date Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="startDate"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <div className="relative">
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

            {/* Branch Filter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Branch Filter</h3>
              <div className="space-y-2">
                <label htmlFor="branchSelect" className="block text-sm font-medium text-gray-700">
                  Select Branch
                </label>
                <select
                  id="branchSelect"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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

            {/* Quick Filters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Filters</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                {[
                  { key: 'today', label: 'Today' },
                  { key: 'thisWeek', label: 'This Week' },
                  { key: 'oneMonth', label: '1 Month' },
                  { key: 'threeMonths', label: '3 Months' },
                  { key: 'sixMonths', label: '6 Months' },
                  { key: 'oneyear', label: '1 Year' }
                ].map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setPresetDates(preset.key)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200 hover:scale-105 text-sm"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={fetchExpenses}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Fetch Expenses
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-900 py-4">Description</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Amount</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Branch</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Created By</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4">Created At</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length > 0 ? (
                  expenses.map(({ _id, discription, amount, createdBy, createdAt, branch }) => (
                    <TableRow key={_id} className="hover:bg-gray-50 transition-colors duration-150">
                      <TableCell className="py-4 font-medium text-gray-900">{discription}</TableCell>
                      <TableCell className="py-4">
                        <span className="font-semibold text-green-600">
                          ${amount.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 font-medium text-gray-900">
                        {branch?.name || "No Branch"}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-600 text-sm font-medium">
                              {createdBy.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {createdBy.username}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-gray-600">
                        {new Date(createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal({ _id, discription, amount, createdBy, createdAt, branch })}
                            className="hover:bg-blue-50 rounded-lg p-2 transition-colors duration-200"
                          >
                            <EditOutlined className="text-blue-600 text-lg" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(_id)}
                            className="hover:bg-red-50 rounded-lg p-2 transition-colors duration-200"
                          >
                            <DeleteOutlined className="text-red-600 text-lg" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
                        <p className="text-gray-600 mb-4">Try adjusting your date range or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Update Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                <h2 className="text-xl font-bold text-white">Update Expense</h2>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="updateDescription" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    id="updateDescription"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={updatedDescription}
                    onChange={(e) => setUpdatedDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="updateAmount" className="block text-sm font-medium text-gray-700">
                    Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      id="updateAmount"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      value={updatedAmount}
                      onChange={(e) => setUpdatedAmount(Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-2xl">
                <button
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-all duration-200"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105"
                  onClick={handleUpdateExpense}
                >
                  Update Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExpenseReport;