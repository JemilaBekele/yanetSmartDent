"use client";

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import PatientComponent from "../../patient/PatientComponent";
import { DeleteOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertModal } from "@/components/modal/alert-modal";
import { Modal } from "@/components/ui/modal";
import { branch } from "../Consent/all";

type enclosedWith = {
  // Flat structure fields
  // Enclosed with type fields
  impUpper?: boolean;
  impLower?: boolean;
  vite?: boolean;
  modelUpper?: boolean;
  modelLower?: boolean;
  bite?: boolean;
  enclosedOther?: boolean;
}

type Restoration = {
  // Flat structure fields
  jointCrown?: boolean;
  separateCrown?: boolean;
  bridge?: boolean;
  other?: boolean;
  
  // Material fields
  pfm?: boolean;
  pfmFacing?: boolean;
  fullMetal?: boolean;
  tiliteFacing?: boolean;
  tilite?: boolean;
  tiliteFullMetal?: boolean;
  tiliteInlayOnlay?: boolean;
  ywPFM?: boolean;
  ywFacing?: boolean;
  ywFullMetal?: boolean;
  bruxzirCrown?: boolean;
  bruxzirBridge?: boolean;
  bruxzirInlayOnlay?: boolean;
  ywUltraTCrown?: boolean;
  ywUltraTBridge?: boolean;
  ywZirconCrown?: boolean;
  ywZirconBridge?: boolean;
  lavaPremium?: boolean;
  lavaClassic?: boolean;
  lavaEssential?: boolean;
  ipsEmaxSingleCrown?: boolean;
  ipsEmaxLaminate?: boolean;
  ipsEmaxInlayOnlay?: boolean;
  ipsEmpressSingleCrown?: boolean;
  ipsEmpressLaminate?: boolean;
  ipsEmpressInlayOnlay?: boolean;
  mockup?: boolean;
  provisional?: boolean;
  _id?: string;
};

type Shade = {
  code?: string;
  diagram?: string;
};

type Margin = {
  shoulderMargin: boolean;
  gingivalMargin: boolean;
  none: boolean;
};

type OcclusalStaining = {
  none: boolean;
  light: boolean;
  medium: boolean;
  dark: boolean;
};

type OcclusalClearance = {
  callDoctor: boolean;
  markOpposing: boolean;
  metalIsland: boolean;
};

type Stage = {
  metalTryIn: boolean;
  copingTryIn: boolean;
  bisqueTryIn: boolean;

};

type PonticDesign = {
  modifiedRidge: boolean;
  fullRidge: boolean;
  hygienic: boolean;
  ovate: boolean;
};

type CollarDesign = {
  noCollar: boolean;
  lingualCollar: boolean;
  collar360: boolean;
};

type DentalLabRecord = {
  _id: string;
  patient: string;
  deliveryDate?: string;
  toothNumbers?: string[];
  toothNumberTwo?: string[];
  enclosedWith: enclosedWith;
  restoration: Restoration;
  shade: Shade;
  margin: Margin;
  occlusalStaining: OcclusalStaining;
  occlusalClearance: OcclusalClearance;
  stage: Stage;
  ponticDesign: PonticDesign;
  collarDesign: CollarDesign;
  specifications?: string;
  notes?: string;
  labnotes?: string;
  modelacceptance?: boolean;
  delivered?: boolean;
  deliveredby?: string;
  createdAt?: string;
  updatedAt?: string;
    finish: boolean;
    branch: branch;
  createdBy?: { username: string };
  changeHistory?: { updatedBy: { username: string }; updateTime: string }[];
};

type DentalLabDisplayProps = {
  params: {
    id: string;
  };
};

const DentalLabDisplay = ({ params }: DentalLabDisplayProps) => {
  const patientId = params.id;
  const [records, setRecords] = useState<DentalLabRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  const router = useRouter();
  
  // State for finish confirmation modal
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DentalLabRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for notes/delivery modal
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [labNotes, setLabNotes] = useState("");
  const [modelAcceptance, setModelAcceptance] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [deliveredBy, setDeliveredBy] = useState("");

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/labratory/${patientId}`);
        console.log("Fetched dental lab records:", res.data);
        
        const recordsData = res.data.data || res.data || [];
        setRecords(Array.isArray(recordsData) ? recordsData : []);
      } catch (error) {
        console.error("Error fetching dental lab records:", error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [patientId]);

  const handleDelete = async (recordId: string) => {
    if (!window.confirm("Are you sure you want to delete this Dental Lab record?")) return;
    const toastId = toast.loading("Deleting...");
    try {
      const res = await axios.delete(`/api/labratory/detail/${recordId}`);
      if (res.data.success) {
        setRecords((prev) => prev.filter((r) => r._id !== recordId));
        toast.update(toastId, { render: "Deleted successfully", type: "success", isLoading: false, autoClose: 3000 });
      } else {
        toast.update(toastId, { render: "Failed to delete", type: "error", isLoading: false, autoClose: 3000 });
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.update(toastId, { render: "Error deleting record", type: "error", isLoading: false, autoClose: 3000 });
    }
  };

  const handleEdit = (patientId: string, recordId: string) => {
    if (role === "doctor") {
      router.push(`/doctor/labratory/edit?recordId=${recordId}&patientId=${patientId}`);
    } else if (role === "admin") {
      router.push(`/admin/labratory/edit?recordId=${recordId}&patientId=${patientId}`);
    }
  };

  // Handle finish confirmation
  const handleFinishConfirm = (record: DentalLabRecord) => {
    setSelectedRecord(record);
    setIsFinishModalOpen(true);
  };

  // Handle finish submission
  const handleSubmitFinish = async () => {
    if (!selectedRecord) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/labratory/detail/${selectedRecord._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedRecord._id,
          finish: true
        
        }),
      });

      if (!response.ok) {
        throw new Error("Error updating Dental Lab Form");
      }

      // Update the local state to reflect the change
      setRecords(prev => prev.map(record => 
        record._id === selectedRecord._id 
          ? { 
              ...record, 
              stage: { ...record.stage, finish: true },
              
            } 
          : record
      ));

      toast.success("Dental Lab Form marked as finished successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update form");
    } finally {
      setIsSubmitting(false);
      setIsFinishModalOpen(false);
      setSelectedRecord(null);
    }
  };

  // Handle opening notes/delivery modal
  const handleOpenNotesModal = (record: DentalLabRecord) => {
    setSelectedRecord(record);
    setLabNotes(record.labnotes || "");
    setModelAcceptance(record.modelacceptance || false);
    setDelivered(record.delivered || false);
    setDeliveredBy(record.deliveredby || "");
    setIsNotesModalOpen(true);
  };

  // Handle submitting notes/delivery changes
  const handleSubmitNotes = async () => {
    if (!selectedRecord) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/labratory/detail/${selectedRecord._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedRecord._id,
          labnotes: labNotes,
          modelacceptance: modelAcceptance,
          delivered: delivered,
          deliveredby: deliveredBy
        }),
      });

      if (!response.ok) {
        throw new Error("Error updating Dental Lab Form");
      }

      // Update the local state to reflect the changes
      setRecords(prev => prev.map(record => 
        record._id === selectedRecord._id 
          ? { 
              ...record, 
              labnotes: labNotes,
              modelacceptance: modelAcceptance,
              delivered: delivered,
              deliveredby: deliveredBy,
              changeHistory: [
                ...(record.changeHistory || []),
                {
                  updatedBy: { username: session?.user?.username || "User" },
                  updateTime: new Date().toISOString()
                }
              ]
            } 
          : record
      ));

      toast.success("Lab notes and delivery information updated successfully!");
      setIsNotesModalOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update information");
    } finally {
      setIsSubmitting(false);
      setSelectedRecord(null);
    }
  };

  const renderUpdates = (updates: DentalLabRecord["changeHistory"]) => {
    if (!updates || updates.length === 0) return null;
    return (
      <div>
        <h3 className="font-semibold">Updates:</h3>
        <ul className="text-sm text-gray-600">
          {updates.map((u, i) => (
            <li key={i}>
              <strong>{u.updatedBy.username}</strong> –{" "}
              {new Date(u.updateTime).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const getSelectedMaterials = (restoration: Restoration) => {
    if (!restoration) return "-";
    
    const materialKeys = [
      'pfm', 'pfmFacing', 'fullMetal', 'tiliteFacing', 'tilite', 'tiliteFullMetal', 
      'tiliteInlayOnlay', 'ywPFM', 'ywFacing', 'ywFullMetal', 'bruxzirCrown', 
      'bruxzirBridge', 'bruxzirInlayOnlay', 'ywUltraTCrown', 'ywUltraTBridge', 
      'ywZirconCrown', 'ywZirconBridge', 'lavaPremium', 'lavaClassic', 'lavaEssential', 
      'ipsEmaxSingleCrown', 'ipsEmaxLaminate', 'ipsEmaxInlayOnlay', 'ipsEmpressSingleCrown', 
      'ipsEmpressLaminate', 'ipsEmpressInlayOnlay', 'mockup', 'provisional'
    ];
    
    return materialKeys
      .filter(key => restoration[key as keyof Restoration] === true)
      .join(", ") || "-";
  };

  const getSelectedRestorationTypes = (restoration: Restoration) => {
    if (!restoration) return "-";
    
    const typeKeys = ['jointCrown', 'separateCrown', 'bridge', 'other'];
    return typeKeys
      .filter(key => restoration[key as keyof Restoration] === true)
      .join(", ") || "-";
  };

  const getSelectedEnclosedTypes = (enclosedWith: enclosedWith) => {
    if (!enclosedWith) return "-";

    const enclosedKeys = ['impUpper', 'impLower', 'vite', 'modelUpper', 'modelLower', 'bite', 'enclosedOther'];
    return enclosedKeys
      .filter(key => enclosedWith[key as keyof typeof enclosedWith] === true)
      .join(", ") || "-";
  };

  const getSelectedOptions = (obj: any) => {
    if (!obj) return "-";
    return Object.entries(obj)
      .filter(([key, value]) => value === true && key !== '_id' && key !== '__v')
      .map(([key]) => key)
      .join(", ") || "-";
  };

  const safeJoin = (array: any[] | undefined, separator: string = ", ") => {
    return array && Array.isArray(array) ? array.join(separator) : "-";
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          {/* Patient Info */}
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>

          {/* Records */}
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Dental Lab Records</h1>
              {(role === "admin" || role === "doctor") && (
                <Link
                  href={`/${role}/labratory/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Record +
                </Link>
              )}
            </div>

            {!Array.isArray(records) || records.length === 0 ? (
              <p className="text-gray-500">No Dental Lab records available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {records.map((rec) => (
                  <div
                    key={rec._id}
                    className="border p-4 rounded-lg shadow-md flex items-start justify-between"
                  >
                    {/* Meta Info   */}
                    <div className="flex flex-col space-y-1 w-1/4">
                     <div className="text-base font-bold text-green-400">
                       Branch: {rec.branch?.name || ""}
                      </div>
                      <div className="text-sm font-bold text-gray-700">
                        {rec.createdBy?.username || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(rec.createdAt || "").toLocaleString()}
                      </div>
                      <div className="flex items-center">
                        {rec.finish ? (
                          <span className="text-green-600 font-bold flex items-center">
                            <CheckCircleOutlined className="mr-1" />  FINISHED
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold flex items-center">
                            <ClockCircleOutlined className="mr-1" /> UNFINISHED
                          </span>
                        )}
                      </div>
                      <div>{renderUpdates(rec.changeHistory)}</div>
                    </div>

                    {/* Record Content */}
                    <div className="flex-grow px-4 space-y-3">
                      {/* Tooth Numbers */}
                      {rec.toothNumbers && rec.toothNumbers.length > 0 && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Upper Teeth
                          </h3>
                          <p>{safeJoin(rec.toothNumbers)}</p>
                        </div>
                      )}
                      
                      {rec.toothNumberTwo && rec.toothNumberTwo.length > 0 && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Lower Teeth
                          </h3>
                          <p>{safeJoin(rec.toothNumberTwo)}</p>
                        </div>
                      )}

                      {/* Restoration */}
                      <div>
                        <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                          Restoration
                        </h3>
                        <p><strong>Type:</strong> {getSelectedRestorationTypes(rec.restoration)}</p>
                        <p><strong>Enclosed Type:</strong> {getSelectedEnclosedTypes(rec.enclosedWith)}</p>
                        <p><strong>Material:</strong> {getSelectedMaterials(rec.restoration)}</p>
                      </div>

                      {/* Shade */}
                      <div>
                        <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                          Shade
                        </h3>
                        <p><strong>Code:</strong> {rec.shade?.code || "-"}</p>
                        {rec.shade?.diagram && (
                          <img
                            src={rec.shade.diagram}
                            alt="Shade Diagram"
                            className="mt-2 max-w-xs border rounded"
                          />
                        )}
                      </div>

                      {/* Margin */}
                      <div>
                        <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                          Margin
                        </h3>
                        <p>{getSelectedOptions(rec.margin)}</p>
                      </div>

                      {/* Other Sections */}
                      {getSelectedOptions(rec.occlusalStaining) !== "-" && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Occlusal Staining
                          </h3>
                          <p>{getSelectedOptions(rec.occlusalStaining)}</p>
                        </div>
                      )}

                      {getSelectedOptions(rec.occlusalClearance) !== "-" && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Occlusal Clearance
                          </h3>
                          <p>{getSelectedOptions(rec.occlusalClearance)}</p>
                        </div>
                      )}

                      {getSelectedOptions(rec.stage) !== "-" && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Stage
                          </h3>
                          <p>{getSelectedOptions(rec.stage)}</p>
                        </div>
                      )}

                      {getSelectedOptions(rec.ponticDesign) !== "-" && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Pontic Design
                          </h3>
                          <p>{getSelectedOptions(rec.ponticDesign)}</p>
                        </div>
                      )}

                      {getSelectedOptions(rec.collarDesign) !== "-" && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Collar Design
                          </h3>
                          <p>{getSelectedOptions(rec.collarDesign)}</p>
                        </div>
                      )}

                      {rec.specifications && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Specifications
                          </h3>
                          <p>{rec.specifications}</p>
                        </div>
                      )}

                      {rec.notes && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Notes
                          </h3>
                          <p>{rec.notes}</p>
                        </div>
                      )}

                      {rec.deliveryDate && (
                        <div>
                          <h3 className="font-semibold border-l-4 border-blue-400 pl-2">
                            Delivery Date
                          </h3>
                          <p>
                            {new Date(rec.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {/* Lab Notes and Delivery Status */}
                      <div className="flex flex-col space-y-2 mt-4">
                        {rec.labnotes && (
                          <div>
                            <h3 className="font-semibold border-l-4 border-purple-400 pl-2">
                              Lab Notes
                            </h3>
                            <p>{rec.labnotes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Model Accepted:</span>
                          {rec.modelacceptance ? (
                            <CheckCircleOutlined className="text-green-500" />
                          ) : (
                            <ClockCircleOutlined className="text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-semibold mr-2">Delivered:</span>
                          {rec.delivered ? (
                            <div className="flex items-center">
                              <CheckCircleOutlined className="text-green-500 mr-1" />
                              <span>by {rec.deliveredby || "Unknown"}</span>
                            </div>
                          ) : (
                            <ClockCircleOutlined className="text-yellow-500" />
                          )}
                        </div>
                      </div>
                    </div>
                                          {(role === "labratory" || role === "admin") && (

<div className="flex flex-col space-y-2">
                   
                        <button
                          className="hover:bg-purple-300 p-2 rounded-full"
                          onClick={() => handleOpenNotesModal(rec)}
                          title="Add notes and delivery info"
                        >
                          <FileTextOutlined className="text-xl text-purple-500" />
                        </button>
                        {!rec.finish && (
                          <button
                            className="hover:bg-green-300 p-2 rounded-full"
                            onClick={() => handleFinishConfirm(rec)}
                            title="Mark as finished"
                          >
                            <CheckCircleOutlined className="text-xl text-green-500" />
                          </button>
                        )}
                   
                      </div>   )}
                    {/* Actions */}
                    {(role === "doctor" || role === "admin") && (
                      <div className="flex flex-col space-y-2">
                        <button
                          className="hover:bg-blue-300 p-2 rounded-full"
                          onClick={() => handleEdit(patientId, rec._id)}
                        >
                          <EditOutlined className="text-xl text-blue-500" />
                        </button>
                   
                        <button
                          className="hover:bg-red-300 p-2 rounded-full"
                          onClick={() => handleDelete(rec._id)}
                        >
                          <DeleteOutlined className="text-xl text-red-500" />
                        </button>
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <ToastContainer />
        
        {/* Finish Confirmation Modal */}
        <AlertModal
          isOpen={isFinishModalOpen}
          onClose={() => {
            setIsFinishModalOpen(false);
            setSelectedRecord(null);
          }}
          onConfirm={handleSubmitFinish}
          loading={isSubmitting}
          title="Mark as Finished?"
          description="Are you sure you want to mark this record as finished? This action cannot be undone."
          confirmText="Yes, Mark as Finished"
          cancelText="Cancel"
          variant="default"
        />
        
        {/* Notes and Delivery Modal */}
      <Modal
  isOpen={isNotesModalOpen}
  onClose={() => {
    setIsNotesModalOpen(false);
    setSelectedRecord(null);
  }}
  title="Lab Notes and Delivery Information"
  description="Update lab notes and delivery information"
  size="lg"
>
  <div className="space-y-4 mt-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Lab Notes
      </label>
      <textarea
        value={labNotes}
        onChange={(e) => setLabNotes(e.target.value)}
        className="w-full p-2 border rounded-md"
        rows={4}
        placeholder="Enter lab notes here..."
      />
    </div>
    
    <div className="flex items-center">
      <input
        type="checkbox"
        id="modelAcceptance"
        checked={modelAcceptance}
        onChange={(e) => setModelAcceptance(e.target.checked)}
        className="mr-2"
      />
      <label htmlFor="modelAcceptance" className="text-sm font-medium text-gray-700">
        Model Accepted
      </label>
    </div>
    
    <div className="flex items-center">
      <input
        type="checkbox"
        id="delivered"
        checked={delivered}
        onChange={(e) => setDelivered(e.target.checked)}
        className="mr-2"
      />
      <label htmlFor="delivered" className="text-sm font-medium text-gray-700">
        Delivered
      </label>
    </div>
    
    {delivered && (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivered By
        </label>
        <input
          type="text"
          value={deliveredBy}
          onChange={(e) => setDeliveredBy(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="Enter name of person who delivered"
        />
      </div>
    )}
    
    <div className="flex justify-end space-x-2 pt-4">
      <button
        onClick={() => setIsNotesModalOpen(false)}
        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        onClick={handleSubmitNotes}
        disabled={isSubmitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </button>
    </div>
  </div>
</Modal>
      </div>
    </div>
  );
};

export default DentalLabDisplay;