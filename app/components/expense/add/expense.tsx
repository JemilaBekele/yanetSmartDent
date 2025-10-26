"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button"


const ExpenseForm = () => {
  // State variables for form data
  const { data: session } = useSession();
    const role = useMemo(() => session?.user?.role || "", [session]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(1); // Default value from schema
 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/Expense", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discription: description,
          amount: amount,
          
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        setMessage("Expense created successfully!");
        setDescription("");
        setAmount(0); // Reset to default value
       
      } else {
        setMessage(`Error: ${data.message}`);
      }
    } catch (error) {
      setMessage("Error creating expense");
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="flex   mt-7 lg:ml-60 w flex-col items-center justify-center min-h-screen bg-gradient-to-br py-8 px-4 sm:px-6 lg:px-8">
    <div className="flex-grow md:ml-60 container mx-auto w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Expense</h1>
        <p className="text-gray-600">Track and manage your expenses efficiently</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description Field */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="description">
              Description
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="description"
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 bg-white text-gray-900 placeholder-gray-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter expense description"
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Brief description of the expense</p>
          </div>

          {/* Amount Field */}
          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-3" htmlFor="amount">
              Amount
              <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">$</span>
              </div>
              <input
                type="number"
                id="amount"
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 group-hover:border-gray-400 bg-white text-gray-900 placeholder-gray-500"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">ETB</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">Enter the expense amount</p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Expense</span>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Expense Report Link */}
        {["reception", "admin"].includes(role) && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link href={`/${role}/expense/all`}>
              <button className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 border border-gray-300 hover:border-gray-400">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>View Expense Report</span>
              </button>
            </Link>
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start space-x-3 animate-in slide-in-from-top duration-300">
            <div className="flex-shrink-0 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-green-800 font-medium">Success!</p>
              <p className="text-green-700 text-sm mt-1">{message}</p>
            </div>
          </div>
        )}
      </div>

     
    </div>
  </div>
);
};

export default ExpenseForm;
