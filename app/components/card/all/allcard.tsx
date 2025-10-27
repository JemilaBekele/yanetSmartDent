"use client";

import { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { DeleteOutlined, EditOutlined, DollarOutlined } from "@ant-design/icons";
import { useSession } from 'next-auth/react';
import { AdvancePaymentModal } from "../../advance/list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type HealthInfo = {
  _id: string;
  cardprice: number;
  createdBy?: {
    username: string;
  };
  branch?: {
    _id: string;
    name: string;
  };
  createdAt: string;
};

type PatientDetailsProps = {
  params: {
    id: string;
  };
};

const CardPage: React.FC<PatientDetailsProps> = ({ params }) => {
  const patientId = params.id;
  const { data: session } = useSession();
  const [healthInfo, setHealthInfo] = useState<HealthInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<HealthInfo | null>(null);
  const [editCardPrice, setEditCardPrice] = useState<number | null>(null);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [patientData, setPatientData] = useState<any>(null); // To store patient data for advance info
  const role = useMemo(() => session?.user?.role || '', [session]);

  useEffect(() => {
    const fetchHealthInfo = async () => {
      setError(null);
      try {
        const response = await fetch(`/api/Invoice/card/${patientId}`, {
          method: "GET",
        });
        const data = await response.json();
        if (response.ok) {
          setHealthInfo(data.data || []);
        } else {
          setError(data.error || "Error fetching health information");
        }
      } catch (err) {
        setError("An error occurred");
      }
    };
    fetchHealthInfo();
  }, [patientId]);

  // Fetch patient data for advance information
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const response = await axios.get(`${patientId}`);
        if (response.data.success) {
          setPatientData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const isCardOlderThanOneDay = (createdAt: string): boolean => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const timeDifference = now.getTime() - createdDate.getTime();
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    return hoursDifference > 24;
  };

  const canModifyCard = (card: HealthInfo): boolean => {
    if (role === "admin") {
      return true;
    }
    
    if (role === "reception") {
      return !isCardOlderThanOneDay(card.createdAt);
    }
    
    return false;
  };

  const handleEdit = (finding: HealthInfo) => {
    if (!canModifyCard(finding)) {
      toast.error("This card cannot be edited as it is more than 24 hours old.");
      return;
    }
    setSelectedFinding(finding);
    setEditCardPrice(finding.cardprice);
  };

  const handleDeleteConfirmation = (recordId: string) => {
    const card = healthInfo.find(info => info._id === recordId);
    if (!card) return;

    if (!canModifyCard(card)) {
      toast.error("This card cannot be deleted as it is more than 24 hours old.");
      return;
    }

    toast.warn(
      <div>
        <span>Are you sure you want to delete this card?</span>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
          <button onClick={() => handleDelete(recordId)}>Yes</button>
          <button onClick={() => toast.dismiss()}>No</button>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDelete = async (recordId: string) => {
    try {
      const response = await axios.delete(`/api/Invoice/card/detail/${recordId}`, {
        data: { recordId },
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setHealthInfo((prevFindings) =>
          prevFindings.filter((healthInfo) => healthInfo._id !== recordId)
        );
        toast.success("Card deleted successfully!");
      } else {
        toast.error(response.data.error || "Error deleting card");
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      toast.error("An unexpected error occurred while deleting the card.");
    } finally {
      toast.dismiss();
    }
  };

  const handleUpdateCardPrice = async () => {
    if (selectedFinding && editCardPrice !== null) {
      if (!canModifyCard(selectedFinding)) {
        toast.error("This card cannot be edited as it is more than 24 hours old.");
        setSelectedFinding(null);
        return;
      }

      try {
        const payload = { recordId: selectedFinding._id, cardprice: editCardPrice };
        const response = await axios.patch(`/api/Invoice/card/detail/${selectedFinding._id}`, payload, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.data.success) {
          setHealthInfo((prevFindings) =>
            prevFindings.map((info) =>
              info._id === selectedFinding._id ? { ...info, cardprice: editCardPrice } : info
            )
          );
          toast.success("Card price updated successfully!");
          setSelectedFinding(null);
        } else {
          toast.error(response.data.error || "Error updating card price");
        }
      } catch (err) {
        console.error("Error updating card price:", err);
        toast.error("An unexpected error occurred while updating the card price.");
      }
    }
  };

  const handleAdvancePaymentSuccess = () => {
    // Refresh patient data after successful advance payment
    const fetchUpdatedPatientData = async () => {
      try {
        const response = await axios.get(`/api/patient/registerdata/${patientId}`);
        if (response.data.success) {
          setPatientData(response.data);
        }
      } catch (error) {
        console.error('Error fetching updated patient data:', error);
      }
    };
    fetchUpdatedPatientData();
    
    toast.success("Advance payment applied successfully!");
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
            
        
          </div>
          
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Card Payment</h1>
              <div className="flex gap-2">
                    <Button
                  onClick={() => setIsAdvanceModalOpen(true)}
                      className="bg-blue-500 text-white px-2 py-2 rounded-md hover:bg-blue-600"
                  size="sm"
                >
                  <DollarOutlined className="mr-2" />
                  Use Advance Payment
                </Button>
                {/* Conditionally render links based on role */}
                {role === 'admin' && (
                  <>
                    <Link
                      href={`/admin/card/add/${patientId}`}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                    >
                      New Card +
                    </Link>
                    <Link
                      href={`/admin/client/edit/${patientId}`}
                      className="bg-green-500 text-white px-2 py-2 rounded-md hover:bg-green-600"
                    >
                      Update Patient Data
                    </Link>
                  </>
                )}
                {role === 'reception' && (
                  <>
                    <Link
                      href={`/reception/card/add/${patientId}`}
                      className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                    >
                      New Card +
                    </Link>
                    <Link
                      href={`/reception/client/edit/${patientId}`}
                      className="bg-green-500 text-white px-2 py-2 rounded-md hover:bg-green-600"
                    >
                      Update Patient Data
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Role-based information banner */}
            {role === "reception" && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 text-sm">
                  <strong>Note for Reception:</strong> You can only edit or delete cards created within the last 24 hours.
                  Older cards are locked for data integrity.
                </p>
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Display Health Information */}
            <div className="space-y-4">
              {healthInfo.length > 0 ? (
                healthInfo.map((info, index) => {
                  const canModify = canModifyCard(info);
                  const isOldCard = isCardOlderThanOneDay(info.createdAt);
                  
                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-lg shadow-xl ${
                        isOldCard ? 'bg-gray-100 border-l-4 border-gray-400' : 'bg-gray-50'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">Card Price: {info.cardprice} ETB</h3>
                          <p className="text-gray-600">
                            Created By: {info.createdBy?.username || 'Unknown'}
                          </p>
                          <p className="text-gray-600">
                            Date: {new Date(info.createdAt).toLocaleDateString()}
                            {isOldCard && (
                              <span className="ml-2 text-orange-600 text-sm font-medium">
                                (Older than 24 hours)
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          {/* Branch Information */}
                          <div className="bg-blue-50 p-3 rounded-md">
                            <h4 className="font-semibold text-blue-800">Branch Information</h4>
                            <p className="text-blue-600">
                              {info.branch?.name ? (
                                <>Branch: <span className="font-medium">{info.branch.name}</span></>
                              ) : (
                                <span className="text-gray-500">No branch assigned</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-start space-x-4 mt-4">
                        {(role === "admin" || role === "reception") && (
                          <>
                            <button
                              className={`p-2 rounded-full transition-colors duration-200 ${
                                canModify 
                                  ? 'hover:bg-blue-300 text-blue-500' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => handleEdit(info)}
                              aria-label="Edit card price"
                              title={canModify ? "Edit card price" : "Cannot edit - card is older than 24 hours"}
                              disabled={!canModify}
                            >
                              <EditOutlined className="text-xl" />
                            </button>

                            <button
                              className={`p-2 rounded-full transition-colors duration-200 ${
                                canModify 
                                  ? 'hover:bg-red-300 text-red-500' 
                                  : 'text-gray-400 cursor-not-allowed'
                              }`}
                              onClick={() => handleDeleteConfirmation(info._id)}
                              aria-label="Delete card"
                              title={canModify ? "Delete card" : "Cannot delete - card is older than 24 hours"}
                              disabled={!canModify}
                            >
                              <DeleteOutlined className="text-xl" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center p-8 bg-gray-100 rounded-lg">
                  <p className="text-gray-500 text-lg">No card payments available for this patient.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Card Price Section */}
      {selectedFinding && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Edit Card Price</h2>
            
            {/* Display current branch info in edit modal */}
            {selectedFinding.branch && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Branch:</strong> {selectedFinding.branch.name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Created:</strong> {new Date(selectedFinding.createdAt).toLocaleString()}
                </p>
              </div>
            )}
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Price (ETB)
            </label>
            <input
              type="number"
              value={editCardPrice || ""}
              onChange={(e) => setEditCardPrice(parseFloat(e.target.value))}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="0.01"
            />
            <div className="mt-4 flex justify-end space-x-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors duration-200"
                onClick={handleUpdateCardPrice}
              >
                Save Changes
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400 transition-colors duration-200"
                onClick={() => setSelectedFinding(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Payment Modal */}
      <AdvancePaymentModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        patientId={patientId}
        onSuccess={handleAdvancePaymentSuccess}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default CardPage;