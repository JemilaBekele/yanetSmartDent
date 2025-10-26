"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined, EditOutlined, FilePdfOutlined } from "@ant-design/icons";
import axios from "axios";
import EditHealthRecordModal from "@/app/components/patient/EditHealthRecordModal";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from 'next-auth/react';
import jsPDF from 'jspdf';

type branch ={
  __id: string;
  name: string;
}
// Align the types for consistency
export type MedicalRecordData = {
  _id: string;
  bloodgroup: string;
  weight: string;
  Medication: string;
  height: string;
  allergies: string;
  habits: string;
  Core_Temperature: string;
  Respiratory_Rate: string;
  Blood_Oxygen: string;
  Blood_Pressure: string;
  heart_Rate: string;
  createdAt?: string;
  updatedAt?: string;
  Hypertension: string;
  Hypotension: string;
  Tuberculosis: string;
  Astema: string;
  Diabetics: string;
  Hepatitis: string;
  BleedingTendency: string;
  Epilepsy: string;
  description: string;
  branch: branch;
  userinfo: Array<{
    BloodPressure: boolean;
    Hypotension: boolean;
    Diabetics: boolean;
    BleedingTendency: boolean;
    Tuberculosis: boolean;
    Epilepsy: boolean;
    Hepatitis: boolean;
    Allergies: boolean;
    Asthma: boolean;
    IfAnydrugstaking: boolean;
    Pregnancy: boolean;
    IfanyotherDiseases: string;
  }>;
  changeHistory?: { updatedBy: { username: string }; updateTime: string }[];
  createdBy?: { username: string };
};

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};

type Patient = {
  firstname: string;
  lastname: string;
  sex?: string;
  cardno: string;
  phoneNumber?: string;
  age: string;
};

const generateHealthInfoPDF = (item: MedicalRecordData[], patientData: Patient) => {
  const doc = new jsPDF();
  
  const formattedDate = item[0]?.createdAt
    ? new Date(item[0].createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";
  
  const name = item[0]?.createdBy?.username || "Unknown";

  // Header Section with Image and Title
  const logoPath = "/assets/file.png";
  const imgWidth = 40, imgHeight = 30;

  doc.addImage(logoPath, "JPEG", 10, 7, imgWidth, imgHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(6, 21, 97);
  doc.text("Yanet Special Dental Clinic", 109, 24, { align: "center" });
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("HEALTH INFORMATION FORM", 105, 35, { align: "center" });

  // Styled Line Below Header
  doc.setDrawColor(6, 21, 97);
  doc.setLineWidth(1.5);
  doc.line(10, 40, 200, 40);
  doc.setDrawColor(39, 235, 245);
  doc.line(10, 42, 200, 42);

  // Patient Information Section
  const startY = 57;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Health Information", 105, 50, { align: "center" });

  // Left Side Patient Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Patient Name: ${patientData.firstname} ${patientData.lastname || ''}`, 10, startY);
  doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 7);
  doc.text(`Card No: ${patientData.cardno}`, 10, startY + 14);

  // Right Side Patient Info
  doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, 140, startY);
  doc.text(`Age: ${patientData.age} yrs`, 140, startY + 7);
  doc.text(`Date: ${formattedDate}`, 140, startY + 14);

  // Health Information Section
  let currentY = startY + 30;
  
  // Basic Information
  const basicInfoFields = [
    { label: "Blood Group", value: item[0]?.bloodgroup },
    { label: "Weight", value: item[0]?.weight },
    { label: "Height", value: item[0]?.height },
  ].filter(field => field.value);

  if (basicInfoFields.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Basic Information", 10, currentY);
    currentY += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    basicInfoFields.forEach((field, index) => {
      doc.text(`${field.label}: ${field.value}`, 15, currentY + (index * 6));
    });
    currentY += basicInfoFields.length * 6 + 5;
  }

  // Lifestyle Information
  const lifestyleFields = [
    { label: "Medications", value: item[0]?.Medication },
    { label: "Allergies", value: item[0]?.allergies },
    { label: "Habits", value: item[0]?.habits },
  ].filter(field => field.value);

  if (lifestyleFields.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Lifestyle & Medications", 10, currentY);
    currentY += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    lifestyleFields.forEach((field, index) => {
      doc.text(`${field.label}: ${field.value}`, 15, currentY + (index * 6));
    });
    currentY += lifestyleFields.length * 6 + 5;
  }

  // Medical Conditions
  const medicalConditions = [
    { label: "Hypertension", value: item[0]?.Hypertension },
    { label: "Hypotension", value: item[0]?.Hypotension },
    { label: "Diabetes", value: item[0]?.Diabetics },
    { label: "Asthma", value: item[0]?.Astema },
    { label: "Epilepsy", value: item[0]?.Epilepsy },
    { label: "Bleeding Tendency", value: item[0]?.BleedingTendency },
    { label: "Hepatitis", value: item[0]?.Hepatitis },
    { label: "Tuberculosis/Pneumonia", value: item[0]?.Tuberculosis },
  ].filter(field => field.value);

  if (medicalConditions.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Medical Conditions", 10, currentY);
    currentY += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    medicalConditions.forEach((field, index) => {
      doc.text(`${field.label}: ${field.value}`, 15, currentY + (index * 6));
    });
    currentY += medicalConditions.length * 6 + 5;
  }

  // Vital Signs (if any exist)
  const vitalSigns = [
    { label: "Core Temperature", value: item[0]?.Core_Temperature },
    { label: "Respiratory Rate", value: item[0]?.Respiratory_Rate },
    { label: "Blood Oxygen", value: item[0]?.Blood_Oxygen },
    { label: "Blood Pressure", value: item[0]?.Blood_Pressure },
    { label: "Heart Rate", value: item[0]?.heart_Rate },
  ].filter(field => field.value);

  if (vitalSigns.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Vital Signs", 10, currentY);
    currentY += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    vitalSigns.forEach((field, index) => {
      doc.text(`${field.label}: ${field.value}`, 15, currentY + (index * 6));
    });
    currentY += vitalSigns.length * 6 + 5;
  }

  // User Information (Boolean Fields)
  if (item[0]?.userinfo && item[0].userinfo.length > 0) {
    const userInfo = item[0].userinfo[0];
    const booleanFields = [
      { label: "Blood Pressure", value: userInfo.BloodPressure },
      { label: "Hypotension", value: userInfo.Hypotension },
      { label: "Diabetes", value: userInfo.Diabetics },
      { label: "Bleeding Tendency", value: userInfo.BleedingTendency },
      { label: "Tuberculosis", value: userInfo.Tuberculosis },
      { label: "Epilepsy", value: userInfo.Epilepsy },
      { label: "Hepatitis", value: userInfo.Hepatitis },
      { label: "Allergies", value: userInfo.Allergies },
      { label: "Asthma", value: userInfo.Asthma },
      { label: "If Any Drugs Taking", value: userInfo.IfAnydrugstaking },
      { label: "Pregnancy", value: userInfo.Pregnancy },
    ].filter(field => field.value);

    if (booleanFields.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Additional Health Information", 10, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      booleanFields.forEach((field, index) => {
        doc.text(`✓ ${field.label}`, 15, currentY + (index * 6));
      });
      currentY += booleanFields.length * 6 + 5;
    }

    // Other Diseases
    if (userInfo.IfanyotherDiseases) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Other Diseases", 10, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const wrappedText = doc.splitTextToSize(`Other Diseases: ${userInfo.IfanyotherDiseases}`, 180);
      wrappedText.forEach((line, index) => {
        doc.text(line, 15, currentY + (index * 6));
      });
      currentY += wrappedText.length * 6 + 5;
    }
  }

  // Description
  if (item[0]?.description) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Additional Notes", 10, currentY);
    currentY += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const wrappedDesc = doc.splitTextToSize(item[0].description, 180);
    wrappedDesc.forEach((line, index) => {
      doc.text(line, 15, currentY + (index * 6));
    });
    currentY += wrappedDesc.length * 6 + 15;
  }

  // Signature Section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Patient's Declaration", 10, currentY);
  currentY += 7;
  
  doc.setFont("helvetica", "normal");
  doc.text("I hereby declare that the health information provided above is true and accurate to the best of my knowledge.", 10, currentY);
  currentY += 10;
  
  doc.text("Patient's Signature: ___________________________", 10, currentY);
  doc.text(`Date: ${formattedDate}`, 10, currentY + 7);
  
  doc.text("Doctor's Name: " + name, 140, currentY);

  // Add doctor's signature image if applicable
  const namesign = name === "Dr jrmila Tessema";
  if (namesign) {
    const doctorImagePath = "/assets/sign.png";
    const imageWidth = 40;
    const imageHeight = 20;
    doc.addImage(doctorImagePath, "JPEG", 145, currentY + 2, imageWidth, imageHeight);
  }

  // Footer Section
  const footerY = doc.internal.pageSize.height - 20;
  doc.setDrawColor(6, 21, 97);
  doc.setLineWidth(0.7);
  doc.line(10, footerY, 200, footerY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for choosing Yanet Special Dental Clinic Addis Ababa, Ethiopia", 105, footerY + 5, {
    align: "center",
  });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Contact: 091 199 7804 | 0904455555", 105, footerY + 10, {
    align: "center",
  });
  doc.text("Address: Bole medanealem Addis Ababa, Ethiopia", 105, footerY + 15, {
    align: "center",
  });

  // Save PDF
  doc.save(`Health_Information_${patientData.firstname}.pdf`);
};

export default function MedicalFindingForm({ params }: MedicalFindingFormProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [existingMedicalFindings, setExistingMedicalFindings] = useState<MedicalRecordData[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<MedicalRecordData | null>(null);
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const role = useMemo(() => session?.user?.role || '', [session]);

  useEffect(() => {
    async function fetchMedicalFindings() {
      try {
        const response = await fetch(`/api/patient/healthInfo/${patientId}`);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        if (result.success) {
          setExistingMedicalFindings(result.data);
        } else {
          console.error("No data found:", result.message);
        }
      } catch (error) {
        console.error("Error fetching medical findings:", error);
      }
    }

    async function fetchPatientData() {
      try {
        const response = await fetch(`/api/patient/registerdata/${patientId}`);
        if (response.ok) {
          const patient = await response.json();
          setPatientData(patient);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    }

    fetchMedicalFindings();
    fetchPatientData();
  }, [patientId]);

  const handleEdit = (finding: MedicalRecordData) => {
    const updatedFinding = { ...finding };
    setSelectedFinding(updatedFinding);
    setIsEditOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditOpen(false);
    setSelectedFinding(null);
  };

  const handleUpdate = async (data: MedicalRecordData) => {
    if (!data._id) return;

    try {
      const payload = { recordId: data._id, ...data };
      const response = await axios.patch(`/api/patient/healthInfo/detail/${data._id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setExistingMedicalFindings((prevFindings) =>
          prevFindings.map((finding) => (finding._id === data._id ? response.data.data : finding))
        );
        toast.success("Record updated successfully!");
      } else {
        toast.error(response.data.error || "Failed to update the record.");
      }
    } catch (err) {
      console.error("Error updating record:", err);
      toast.error("An unexpected error occurred while updating the record.");
    } finally {
      handleCloseModal();
    }
  };

  const handleDelete = async (recordId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this health information? This action cannot be undone."
    );
  
    if (!confirmDelete) {
      return;
    }
  
    const toastId = toast.loading("Deleting health information...");
  
    try {
      const response = await axios.delete(`/api/patient/healthInfo/detail/${recordId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: { recordId },
      });
  
      if (response.data.success) {
        setExistingMedicalFindings((prevFindings) =>
          prevFindings.filter((finding) => finding._id !== recordId)
        );
        toast.update(toastId, {
          render: "Health Information deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: response.data.error || "Failed to delete health information.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        console.error("Failed to delete health information:", response.data.error);
      }
    } catch (err) {
      toast.update(toastId, {
        render: "An unexpected error occurred while deleting the record.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error deleting record:", err);
    }
  };

  const handleGeneratePDF = (finding: MedicalRecordData) => {
    if (!patientData) {
      toast.error("Patient data not available");
      return;
    }
    generateHealthInfoPDF([finding], patientData);
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
          <strong>{update.updatedBy.username}</strong><br />
           {new Date(update.updateTime).toLocaleString()}</div><br />
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
              <h1 className="text-2xl font-bold">Health Information</h1>
            
              <Link
                href={`/${role}/medicaldata/healthinfo/add/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Medical History +
              </Link>
              <Link
                href={`/${role}/medicaldata/healthinfo/vital/${patientId}`}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                New Vital Signs +
              </Link>
            </div>

            {existingMedicalFindings.length === 0 ? (
              <p className="text-gray-500">No medical findings available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {existingMedicalFindings.map((finding) => (
                  <div key={finding._id} className="border p-4 rounded-lg shadow-md flex items-start justify-between">
                    <div className="flex flex-col space-y-2">
                          
                      <div className="text-green-600 font-bold text-normal ">
                        Branch: {finding.branch?.name || ""}
                      </div>
                      <div className="text-gray-400 text-sm p-2">
                        {new Date(finding.createdAt || "").toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-gray-600 font-bold text-sm ">
                        {finding.createdBy?.username || "Unknown"}
                      </div>
                  
                      <div className="text-gray-600 text-sm "> {renderUpdates(finding.changeHistory)}</div>
                    </div>
                    <div className="flex-grow px-4">
                    {finding.userinfo && finding.userinfo.length > 0 && (
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        {Object.entries(finding.userinfo[0]).map(([key, value]) => {
                          if (key === "_id" || key === "IfanyotherDiseases") return null;
                          return (
                            <div key={key} className="p-1 rounded-lg">
                              <p className="font-bold">{key === "Tuberculosis" ? "Tuberculosis / Pneumonia" : key.replace(/([A-Z])/g, ' $1').trim()}</p>
                              <div className={`text-sm ${value ? "text-green-500" : "text-red-500"}`}>
                                {value ? "True" : "False"}
                              </div>
                            </div>
                          );
                        })}
                        <div className="p-3 rounded-lg">
                          <p className="font-bold">If any other diseases:</p>
                          <div className="text-sm">{finding.userinfo[0].IfanyotherDiseases || ""}</div>
                        </div>
                      </div>
                    )}
                      {finding.bloodgroup && <p>Blood Group: {finding.bloodgroup}</p>}
                      {finding.weight && <p>Weight: {finding.weight}</p>}
                      {finding.height && <p>Height: {finding.height}</p>}
                      {finding.Medication && <p>Medication:{finding.Medication}</p>}
                      {finding.allergies && <p>Allergies: {finding.allergies}</p>}
                      {finding.habits && <p>Habits: {finding.habits}</p>}
                      {finding.Blood_Pressure &&
                      <>
                      <p><strong>Vital Signs:</strong></p>
                      <ul className="list-disc ml-4">
                        <li>Core Temperature: {finding.Core_Temperature}</li>
                        <li>Respiratory Rate: {finding.Respiratory_Rate}</li>
                        <li>Blood Oxygen: {finding.Blood_Oxygen}</li>
                        <li>Blood Pressure:{finding.Blood_Pressure}</li>
                        <li>Heart Rate: {finding.heart_Rate}</li>
                      </ul></>}
                      {finding.Hypertension && <p>Hypertension: {finding.Hypertension}</p>}
                      {finding.Hypotension && <p>Hypotension: {finding.Hypotension}</p>}
                      {finding.Tuberculosis && <p>Tuberculosis or Pneumonia:{finding.Tuberculosis}</p>}
                      {finding.Astema && <p>Astema: {finding.Astema}</p>}
                      {finding.Hepatitis && <p>Hepatitis: {finding.Hepatitis}</p>}
                      {finding.Diabetics && <p>Diabetics:{finding.Diabetics}</p>}
                      {finding.BleedingTendency && <p>BleedingTendency: {finding.BleedingTendency}</p>}
                      {finding.Epilepsy && <p>Epilepsy: {finding.Epilepsy}</p>}
                      {finding.description && <p>Description: {finding.description}</p>}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button
                        className="hover:bg-blue-300 p-2 rounded-full"
                        onClick={() => handleEdit(finding)}
                        aria-label="Edit medical record"
                        title="Edit medical record"
                      >
                        <EditOutlined className="text-xl text-blue-500" />
                      </button>
                      <button
                        className="hover:bg-green-300 p-2 rounded-full"
                        onClick={() => handleGeneratePDF(finding)}
                        aria-label="Generate PDF"
                        title="Generate PDF"
                      >
                        <FilePdfOutlined className="text-xl text-green-500" />
                      </button>
                      <button
                        className="hover:bg-red-300 p-2 rounded-full"
                        onClick={() => handleDelete(finding._id)}
                        aria-label="Delete medical record"
                        title="Delete medical record"
                      >
                        <DeleteOutlined className="text-xl text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <EditHealthRecordModal
          isOpen={isEditOpen}
          formData={selectedFinding}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
        <ToastContainer />
      </div>
    </div>
  );
}