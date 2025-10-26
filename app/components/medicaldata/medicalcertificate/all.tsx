"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";

import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import EditCertificateModal from "./edit";
import { branch } from "../Consent/all";


type MedicalCertificateData = {
  _id: string;
  diagnosis: string;
  briefExplanation: string;
  branch: branch;
  restDate: string;
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

type CertificatePageProps = {
  params: { id: string }; // Patient ID
};

export default function CertificatePage({ params }: CertificatePageProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [certificates, setCertificates] = useState<MedicalCertificateData[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<MedicalCertificateData | null>(null);
  const role = useMemo(() => session?.user?.role || "", [session]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/api/medicalcerteficate/${patientId}`);

        if (response.data.success) {
          const { patient, MedicalCertificate } = response.data.data;
          setPatientData(patient);
          setCertificates(MedicalCertificate);
        } else {
          toast.error("Failed to fetch data.");
        }
      } catch (error) {
        toast.error("An error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [patientId]);
  const handleUpdate = async (data: MedicalCertificateData) => {
    if (!data._id) return;
    try {
      const payload = { recordId: data._id, ...data };
      const response = await axios.patch(`/api/medicalcerteficate/detail/${data._id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        setCertificates((prev) =>
          prev.map((cert) => (cert._id === data._id ? response.data.data : cert))
        );
        toast.success("Certificate updated successfully!");
      } else {
        toast.error(response.data.error || "Failed to update certificate.");
      }
    } catch (error) {
      console.error("Error updating certificate:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsEditOpen(false);
    }
  };
  const handleDelete = async (certificateId: string) => {
    // Display a confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this certificate?");
  
    if (!confirmDelete) {
      // If the user cancels, exit the function
      return;
    }
  
    try {
      const response = await axios.delete(`/api/medicalcerteficate/detail/${certificateId}`);
      if (response.data.success) {
        // Update the state to remove the deleted certificate
        setCertificates((prev) => prev.filter((cert) => cert._id !== certificateId));
        toast.success("Certificate deleted successfully!");
      } else {
        toast.error(response.data.error || "Failed to delete certificate.");
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
      toast.error("An unexpected error occurred.");
    }
  };
  
  
  
 



  const generatePDF = (certificate: MedicalCertificateData, patientData: PatientData) => {
    const formattedDate = new Date(certificate.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const doc = new jsPDF();
    const name = certificate.createdBy?.username || "Unknown";
    // Header Section with Image and Title
    const logoPath = "/assets/file.png"; // Path to your logo image
    const imgWidth = 40, imgHeight = 30;
  
    doc.addImage(logoPath, "JPEG", 10, 7, imgWidth, imgHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
  
    // Set the light red color for the main title text
    doc.setTextColor(59, 114, 182); // Light Red
    doc.text("Yanet Special Dental Clinic", 109, 24, { align: "center" });
    doc.setFontSize(18);
    
      doc.setTextColor(0, 0, 0); // Black for subheading for contrast

    // Set the font for the subheading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Medical Certificates", 105, 35, { align: "center" });
  
    // Styled Line Below Header
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(1.5);
    doc.line(10, 40, 200, 40);
  
doc.setDrawColor(39, 235, 245); // Yellow
    doc.line(10, 42, 200, 42);
  
    // Patient Information Section
    const startY = 50;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Reset color
    doc.setFont("helvetica", "normal");
  
    // Left Side
    doc.text(`Patient Name: ${patientData.firstname}`, 10, startY);
    doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 7);
    doc.text(`Card No: ${patientData.cardno}`, 10, startY + 14);
  
    // Right Side
    doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, 140, startY);
    doc.text(`Age: ${patientData.age} yrs`, 140, startY + 7);
    doc.text(`Date: ${formattedDate}`, 140, startY + 14);
  
    // Medical Certificate Information Section (Styled)
    let prescriberY = startY + 35;
    const sectionPadding = 10;
    const boxMargin = 5;
  
    // Section Title with Styling
    doc.setFont("helvetica", "bold");
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(14);
    doc.text("Medical Certificate Information", 10, prescriberY+2);
    doc.setFontSize(10);
    // Calculate dynamic content height based on available data
    let contentHeight = 0;
    contentHeight += certificate.diagnosis ? 7 : 0;
    contentHeight += certificate.briefExplanation ? 7 : 0;
    contentHeight += certificate.restDate ? 7 : 0;
    contentHeight += 7 * 4; // Extra space for the lines and fields
  
    const boxHeight = contentHeight + 40; // Add padding to the box height
  
    // Draw a flexible box to highlight this section
    doc.setDrawColor(93, 116, 122); // Box Color
    doc.setLineWidth(0.7);
    doc.rect(5, prescriberY - boxMargin, 200, boxHeight); // Adjusted box height
  
    // Wrapping and positioning text inside the box
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
  
    // Wrapping Diagnosis and Explanation
    if (certificate.diagnosis) {
      const diagnosisText = `Diagnosis: ${certificate.diagnosis}`;
      const wrappedDiagnosis = doc.splitTextToSize(diagnosisText, 190); // 190 is width of the box (200 - margins)
      doc.text(wrappedDiagnosis, 10, prescriberY + sectionPadding);
      prescriberY += wrappedDiagnosis.length * 5; // Adjust Y position after the diagnosis text
    }
  
    if (certificate.briefExplanation) {
      const explanationText = `Brief Explanation: ${certificate.briefExplanation}`;
      const wrappedExplanation = doc.splitTextToSize(explanationText, 190);
      doc.text(wrappedExplanation, 10, prescriberY + 14);
      prescriberY += wrappedExplanation.length * 5; // Adjust Y position after the explanation
    }
    if (certificate.restDate) {
    // Rest Period (Styled)
    doc.setFont("helvetica", "normal");
    const restPeriodText = `Rest Period: ${certificate.restDate} days`;
    const wrappedRestPeriod = doc.splitTextToSize(restPeriodText, 190);
    doc.text(wrappedRestPeriod, 10, boxHeight + 65);
    prescriberY += wrappedRestPeriod.length * 5;
    }
   
    
    // Now move Doctor's Name, Signature, and Date outside the box
    prescriberY += boxHeight + 5; // Adjust Y position to place content below the box
    const namesign = name === "Dr jemu Tessema";
    if (namesign) {
      const doctorImagePath = "/assets/sign.png"; // Image path for Dr Tedla Tessema's background image
  // Y position for image
      const imageWidth = 40; // Width of the image
      const imageHeight = 20; // Height of the image
      doc.addImage(doctorImagePath, "JPEG", 39, prescriberY +5, imageWidth, imageHeight);
    }
    // Doctor's Name
    doc.text(`Doctor’s Name: ${certificate.createdBy?.username}`, 10, prescriberY + 7);
  
    // Signature and Date Section
    doc.setFont("helvetica", "normal");
    doc.text("Signature: _________________________", 10, prescriberY + 14);
    doc.text(`Date: ${formattedDate}`, 10, prescriberY + 21);
  
    // Footer Section
    const footerY = doc.internal.pageSize.height - 30;
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(0.7);
    doc.line(10, footerY, 200, footerY);
  
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for choosing Yanet Special Dental Clinic", 105, footerY + 5, {
      align: "center",
    });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Contact: 091 199 7804 | 0904455555", 105, footerY + 10, {
      align: "center",
    });
    doc.text("Email: amlymengistu@gmail.com", 105, footerY + 15, {
      align: "center",
    });
    doc.text("Address: Bole medanealem Addis Ababa,Ethiopia", 105, footerY + 20, {
      align: "center",
    });
  
    // Save PDF
    doc.save(`Medical_Certificate_${patientData.firstname}.pdf`);
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
              <h1 className="text-2xl font-bold">Medical Certificates</h1>
              {role === "doctor" && (
                <Link
                  href={`/doctor/medicalcertificate/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Certificate +
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href={`/admin/medicalcertificate/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Certificate +
                </Link>
              )}
            </div>

            {isLoading ? (
              <p className="text-gray-500">Loading certificates...</p>
            ) : certificates.length === 0 ? (
              <p className="text-gray-500">No certificates available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {certificates.map((certificate) => (
                  <div
                    key={certificate._id}
                    className="border p-4 rounded-lg shadow-md flex items-start justify-between"
                  >
                    <div className="flex flex-col space-y-2"> 
                       <div className="text-green-400 text-base">
                        Branch: {certificate.branch?.name || ""}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Date Issued: {new Date(certificate.createdAt || "").toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-gray-600 text-sm">
                        Issued by: {certificate.createdBy?.username || "Unknown"}
                      </div>
                      <div className="text-gray-600 text-sm">
                   <div className="text-gray-600 text-sm p-2"> {renderUpdates(certificate.changeHistory)}</div>
                   </div>
                    </div>

                    <div className="flex-grow px-4">
  <p>
    Diagnosis: {certificate.diagnosis}
  </p>
  <p>
    Brief Explanation:{certificate.briefExplanation}
  </p>
  { certificate.restDate &&
  <p>
    Rest Period: 
    { certificate.restDate} days
  </p>}
</div>


                    <div className="flex flex-col space-y-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => patientData && generatePDF(certificate, patientData)}
                      >
                        <DownloadOutlined />
                      </button>
                      {(role === 'doctor' || role === 'admin') && (
                        <>
                        <button
                        className="hover:bg-blue-300 p-2 rounded-full"
                        onClick={() => {
                          setSelectedCertificate(certificate); // Set the selected certificate
                          setIsEditOpen(true); // Open the modal
                        }}
                      >
                        <EditOutlined className="text-xl text-blue-500" />
                      </button>
                      
                    
                      <button
  className="hover:bg-red-300 p-2 rounded-full"
  onClick={() => handleDelete(certificate._id)}
  aria-label="Delete certificate"
  title="Delete certificate"
>
  <DeleteOutlined className="text-xl text-red-500" />
</button>  </>)}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <EditCertificateModal
          isOpen={isEditOpen}
          formData={selectedCertificate}
          onClose={() => setIsEditOpen(false)}
          onUpdate={handleUpdate} 
        />
        <ToastContainer />
      </div>
    </div>
  );
}
