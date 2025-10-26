"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";

type ProcedureData = {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProcedurePage() {
  const { data: session } = useSession();
  const [procedures, setProcedures] = useState<ProcedureData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const role = session?.user?.role || "";

  useEffect(() => {
    fetchProcedures();
  }, []);

  const fetchProcedures = async () => {
    try {
      const response = await axios.get("/api/Procedure");
      if (response.status === 200) {
        setProcedures(response.data);
      }
    } catch (error) {
      console.error("Error fetching procedures:", error);
      toast.error("Failed to load procedures");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProcedure = async (procedureId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this procedure?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/Procedure/${procedureId}`);
      if (response.status === 200) {
        setProcedures((prev) => prev.filter((p) => p._id !== procedureId));
        toast.success("Procedure deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error deleting procedure:", error);
      toast.error(error.response?.data?.message || "Failed to delete procedure");
    }
  };

  // Function to render description with line breaks
  const renderDescription = (description: string) => {
    if (!description) return null;
    
    return description.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < description.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
       <div className="flex ml-13 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <FileTextOutlined className="text-blue-600 text-4xl mb-2" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Procedure and Protocols List</h2>
          <p className="text-gray-600 text-sm">
            Manage all available procedures in your clinic
          </p>
        </div>

        {/* Add Link */}
        {role === "admin" && (
          <div className="flex justify-end mb-6">
            <Link
              href="/admin/Procedure/add"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium flex items-center shadow-md hover:shadow-lg text-sm"
            >
              <PlusOutlined className="mr-1" />
              Add Procedure
            </Link>
          </div>
        )}

        {/* Procedures List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-gray-500">Loading procedures...</p>
          </div>
        ) : procedures.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 text-2xl">📄</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-1">
              No Procedures Added Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              {role === "admin"
                ? "Click 'Add Procedure' to create your first procedure record."
                : "Check back later for available procedures."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {procedures.map((procedure) => (
              <div
                key={procedure._id}
                className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {procedure.title}
                    </h3>
                    {procedure.description && (
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {renderDescription(procedure.description)}
                      </p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      Created: {new Date(procedure.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {role === "admin" && (
                    <div className="flex space-x-2 ml-4">
                      <Link
                        href={`/admin/Procedure/${procedure._id}`}
                        className="p-2 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        <EditOutlined />
                      </Link>
                      <button
                        onClick={() => handleDeleteProcedure(procedure._id)}
                        className="p-2 rounded-full text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors"
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <ToastContainer position="top-right" autoClose={4000} />
      </div>
    </div>
  );
}