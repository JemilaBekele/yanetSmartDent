"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import EditNoteModal from "./edit";

type ReferralData = {
  _id: string;
  Note: string;
  
  changeHistory: { updatedBy: { username: string }; updateTime: string }[];
  createdBy?: { username: string };
  createdAt: string;
};

type PatientData = {
  phoneNumber: string;
  firstname: string;
  sex: string;
  Town: string;
  KK: string;
  age: string;
  updatedAt: string;
  cardno: string;
  date: string;
};

type ReferralPageProps = {
  params: { id: string }; // Patient ID
};

export default function NotePage({ params }: ReferralPageProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [note, setNote] = useState<ReferralData[]>([]);
  const [, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const role = useMemo(() => session?.user?.role || "", [session]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/api/Note/${patientId}`);

        if (response.data.success) {
          const { patient, Note } = response.data.data;
          setPatientData(patient);
          setNote(Note);
        } else {
          toast.error("Failed to fetch data.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [patientId]);

  const handleUpdate = async (data: ReferralData) => {
    if (!data._id) return;
    try {
      const payload = { recordId: data._id, ...data };
      const response = await axios.patch(`/api/Note/detail/${data._id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        setNote((prev) =>
          prev.map((ref) => (ref._id === data._id ? response.data.data : ref))
        );
        toast.success("Note updated successfully!");
      } else {
        toast.error(response.data.error || "Failed to update Note.");
      }
    } catch (error) {
      console.error("Error updating Note:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsEditOpen(false);
    }
  };

  const handleDelete = async (referralId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this Note?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/Note/detail/${referralId}`);
      if (response.data.success) {
        setNote((prev) => prev.filter((ref) => ref._id !== referralId));
        toast.success("Note deleted successfully!");
      } else {
        toast.error(response.data.error || "Failed to delete Note.");
      }
    } catch (error) {
      console.error("Error deleting Note:", error);
      toast.error("An unexpected error occurred.");
    }
  };


  const renderUpdates = (updates: { updatedBy: { username: string }; updateTime: string }[] | undefined) => {
    if (!updates || updates.length === 0) return <div></div>;

    return (
      <div>
        <h3>Update:</h3>
        <ul>
          {updates.map((update, index) => (
            <li key={index}>
              <div>
                <strong> {update.updatedBy.username}</strong><br />
                {new Date(update.updateTime).toLocaleString()}
              </div>
              <br />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Notes</h1>
              {role === "doctor" && (
                <Link
                  href={`/doctor/Note/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Note+
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href={`/admin/Note/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Note +
                </Link>
              )}
               {role === "labratory" && (
                <Link
                  href={`/labratory/Note/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Note +
                </Link>
              )}
            </div>

            {isLoading ? (
  <p className="text-gray-500">Loading Notes...</p>
) : !note || note.length === 0 ? (
  <p className="text-gray-500">No Note.</p>
) : (
  <div className="grid grid-cols-1 gap-4">

                {note.map((referral) => (
                  <div
                    key={referral._id}
                    className="border p-4 rounded-lg shadow-md flex items-start justify-between"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="text-gray-600 text-sm">
                        Date Issued: {new Date(referral.createdAt || "").toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Issued by: {referral.createdBy?.username || "Unknown"}
                      </div>
                      <div className="text-gray-600 text-sm p-2">
                        {renderUpdates(referral.changeHistory)}
                      </div>
                    </div>

                    <div className="flex-grow px-4">
  <p>Note: {referral.Note}</p>
 
</div>

                    <div className="flex flex-col space-y-2">
                      {(role === 'doctor' || role === 'admin') && (
                        <>
                          <button
                            className="hover:bg-blue-300 p-2 rounded-full"
                            onClick={() => {
                              setSelectedReferral(referral);
                              setIsEditOpen(true);
                            }}
                          >
                            <EditOutlined className="text-xl text-blue-500" />
                          </button>
                          <button
                            className="hover:bg-red-300 p-2 rounded-full"
                            onClick={() => handleDelete(referral._id)}
                            aria-label="Delete referral"
                            title="Delete referral"
                          >
                            <DeleteOutlined className="text-xl text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <EditNoteModal
          isOpen={isEditOpen}
          formData={selectedReferral}
          onClose={() => setIsEditOpen(false)}
          onUpdate={handleUpdate}
        />
        <ToastContainer />
      </div>
    </div>
  );
}