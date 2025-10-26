"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { DeleteOutlined, DownloadOutlined, EditOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import EditPrescriptionModal from "../editmodal/edit";
import { branch } from "../../Consent/all";


type PrescriptionData = {
  changeHistory: { updatedBy: { username: string }; updateTime: string }[];
  _id: string;
  description: string;
  Name: string;
  diagnosis: string;
  createdBy?: { username: string };
  createdAt: string;
  updatedAt:string;
  branch:branch;
  price?: string;
  cardNumber?:string
};

type PatientData = {
  HNo: string;
  phoneNumber: string;
  firstname: string;
  sex: string;
  Town: string;
  KK: string;
  age: string;
  updatedAt: string;
  cardno: string;
  date: string;
  Region: string;
  Woreda: string;
  weight?: string;
};

type PrescriptionPageProps = {
  params: { id: string }; // Patient ID
};
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
export default function PrescriptionPage({ params }: PrescriptionPageProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionData | null>(null);
  const role = useMemo(() => session?.user?.role || "", [session]);

  // Fetch patient data and prescriptions
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/api/perscription/${patientId}`);
        
        if (response.data.success) {
          const { patient, Prescription, healthInfo } = response.data.data;
          console.log(response.data.data.patient);

          // 🔹 Include weight from healthInfo if available
          setPatientData({ ...patient, weight: healthInfo?.weight || "" });
          setPrescriptions(Prescription);
        } else {
          toast.error("Failed to fetch patient data.");
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

  // Generate PDF with Patient and Prescription Data
   // Generate PDF with Patient and Prescription Data
  const generatePDF = (
    prescription: PrescriptionData[],
    patientData: PatientData
  ) => {
    const doc = new jsPDF();
    const firstPrescription = prescription[0]; 
    const formattedDate = new Date(firstPrescription.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    // Header Section with Image and Title
    const logoPath = "/assets/file.png"; 
    const name = firstPrescription.createdBy?.username || "Unknown";
    const imgWidth = 40, imgHeight = 30;
  
    doc.addImage(logoPath, "JPEG", 10, 7, imgWidth, imgHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    
    // Set the light red color for the main title text
    doc.setTextColor(59, 114, 182); // Light Red
    doc.text("Yanet Special Dental Clinic", 109, 24, { align: "center" });
    doc.setFontSize(18);
    // doc.setTextColor(89, 154, 222);
    // doc.text("", 105, 26, { align: "center" });
    // Set the font for the subheading
        doc.setTextColor(0, 0, 0); // Black for subheading for contrast

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    
   
    doc.text("PRESCRIPTION PAPER", 105, 35, { align: "center" });
  
    // Styled Line Below Header
     // Styled Line with Gap
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
  
   // Left Column
   doc.text(`Code: ${firstPrescription.cardNumber || ""}`, 170, startY);

doc.text(`Patient's Full Name: ${patientData.firstname|| ""}`, 10, startY+7);


doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 14);
doc.text(`Age: ${patientData.age} yrs`, 10, startY + 21);
doc.text(`Weight: ${patientData.weight || ""}`, 10, startY + 28);

doc.text(`Woreda:  ${patientData.Woreda || ""}`, 10, startY + 35);
doc.text(`Kebele: ${patientData.KK || ""}`, 10, startY + 42);
doc.text(`Diagnosis (if not ICD): ${firstPrescription.diagnosis || ""}`, 10, startY + 49);

// Middle Column
doc.text(`Card No: ${patientData.cardno}`, 100, startY+14);
doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, 100, startY + 21);
doc.text(`Town: ${patientData.Town || ""}`, 100, startY + 28);
doc.text(`House No: ${patientData.HNo || ""}`, 100, startY + 35);
doc.text(`Region: ${patientData.Region || ""}`, 100, startY + 42);


// Right Column
// Date
doc.text(`Date: ${formattedDate}`, 170, startY + 14);

// Outpatient (Aligned)
doc.text("Outpatient:", 170, startY + 21);
doc.rect(190, startY + 18, 4, 4); // Adjusted for proper alignment

// Inpatient (Aligned)
doc.text("Inpatient:", 170, startY + 28);
doc.rect(190, startY + 25, 4, 4); 
    // Prescription Table
    const tableStartY = 110;
    const tableData = prescription.map((item) => [
      item.description,
      item.price || "",
    ]);
  
    autoTable(doc, {
      startY: tableStartY,
      head: [
        [
          "Drug Name, Strength, Dosage Form, Dose Frequency,Duration, Quantity, \nHow to use & Other Information",
          "Price",
        ],
      ],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [240, 240, 240], textColor: 0, halign: "left" }, // Align title to the left
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 150, halign: "left" }, // Ensure first column starts at the left
        1: { cellWidth: 30, halign: "center" }, // Align price properly
      },
      theme: "grid", // Adds borders to all cells
    
     
    });
    
  
  
   
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    
 
    // Prescriber and Dispense Section
    const prescriberY = doc.lastAutoTable.finalY + 20;
    const namesign = name === "Dr Tedla Tessema";
    if (namesign) {
      const doctorImagePath = "/assets/sign.png"; // Image path for Dr Tedla Tessema's background image
  // Y position for image
      const imageWidth = 40; // Width of the image
      const imageHeight = 20; // Height of the image
      doc.addImage(doctorImagePath, "JPEG", 32, prescriberY + 10, imageWidth, imageHeight);
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  
    doc.text("Prescriber's Information:", 10, prescriberY);
    doc.text(`Full Name: ${firstPrescription?.createdBy?.username || "N/A"}`, 10, prescriberY + 7);

    doc.text("Qualification: ______________________", 10, prescriberY + 14);
    doc.text("Registration No: ____________________", 10, prescriberY + 21);
    doc.text("Signature: _________________________", 10, prescriberY + 28);
    doc.text(`Date: ${formattedDate}`, 10, prescriberY + 35);
  
    // Dispense Section (Parallel to Prescriber)
    doc.text("Dispense:", 140, prescriberY);
    doc.text("__________________________", 140, prescriberY + 7);
    doc.text("__________________________", 140, prescriberY + 14);
    doc.text("__________________________", 140, prescriberY + 21);
    doc.text("__________________________", 140, prescriberY + 28);
    doc.text("__________________________", 140, prescriberY + 35);
  
    
   
  
    
   
  
   
    // Footer Section
    const footerY = doc.internal.pageSize.height - 30;
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(0.7);
    doc.line(10, footerY, 200, footerY);
  
    doc.setFontSize(10);
    
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for choosing Yanet Special Dental Clinic Addis Ababa,Ethiopia ", 105, footerY + 5, {
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
    doc.save(`Prescription_${patientData.firstname}.pdf`);
  };

  const handleEdit = (prescription: PrescriptionData) => {
    setSelectedPrescription(prescription);
    setIsEditOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditOpen(false);
    setSelectedPrescription(null);
  };

   // Handle Update
   const handleUpdate = async (data: PrescriptionData) => {
    if (!data._id) return;
    try {
        const payload = { recordId: data._id, ...data };
      const response = await axios.patch(`/api/perscription/detail/${data._id}`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setPrescriptions((prev) =>
          prev.map((prescription) => (prescription._id === data._id ? response.data.data : prescription))
        );
        toast.success("Prescription updated successfully!");
      } else {
        toast.error(response.data.error || "Failed to update prescription.");
      }
    } catch (error) {
      console.error("Error updating prescription:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      handleCloseModal();
    }
  };

  

  // Handle Delete
  const handleDelete = async (recordId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this prescription? This action cannot be undone."
    );
  
    if (!confirmDelete) {
      return; // Exit if the user cancels the action
    }
  
    const toastId = toast.loading("Deleting prescription...");
  
    try {
      const response = await axios.delete(`/api/perscription/detail/${recordId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: { recordId }, // Send recordId in the request body
      });
  
      if (response.data.success) {
        setPrescriptions((prev) => prev.filter((p) => p._id !== recordId));
        toast.update(toastId, {
          render: "Prescription deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: "Failed to delete prescription.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        console.error("Failed to delete the prescription:");
      }
    } catch (error) {
      toast.update(toastId, {
        render: "An unexpected error occurred.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error deleting prescription:");
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
              <h1 className="text-2xl font-bold">Prescriptions</h1>
              {role === "doctor" && (
                <Link
                  href={`/doctor/prescriptions/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Prescription +
                </Link>
              )}
               {role === "admin" && (
                <Link
                  href={`/admin/prescriptions/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Prescription +
                </Link>
              )}
            </div>

            {isLoading ? (
              <p className="text-gray-500">Loading prescriptions...</p>
            ) : prescriptions.length === 0 ? (
              <p className="text-gray-500">No prescriptions available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {prescriptions.map((prescription) => (
                 <div
                 key={prescription._id}
                 className="border p-4 rounded-lg shadow-md flex items-start justify-between"
               >
                 {/* Left Section: Date & Prescriber */}
                 <div className="flex flex-col space-y-2">
                   <div className="text-gray-600 text-sm">
                      <div className="text-green-600 text-base">
                     <strong>Branch:</strong> {prescription.branch?.name || ""}
                   </div>
                     <strong>Date:</strong>{" "}
                     {new Date(prescription.createdAt || "").toLocaleDateString("en-GB", {
                       day: "2-digit",
                       month: "short",
                       year: "numeric",
                     })}
                   </div>
                   <div className="text-gray-600 text-sm">
                     <strong>Prescribed by:</strong> {prescription.createdBy?.username || ""}
                   </div>
                   <div className="text-gray-600 text-sm">
                   <div className="text-gray-600 text-sm p-2"> {renderUpdates(prescription.changeHistory)}</div>
                   </div>
                  
                 </div>
               
                 {/* Middle Section: Prescription Details */}
                 <div className="flex-grow px-4">
             
                   <p>
                     <strong>Diagnosis:</strong> {prescription?.diagnosis || ""}
                   </p>
                   <p>
                     <strong>Description:</strong> {prescription?.description}
                   </p>
                 </div>
               
                 {/* Right Section: Actions */}
                 <div className="flex flex-col space-y-2">
                   <button
                     className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                     onClick={() => patientData && generatePDF([prescription], patientData)}
                   >
                     <DownloadOutlined />
                   </button>
               
                   {(role === "doctor" || role === "admin") && (
                     <>
                       <button
                         className="hover:bg-blue-300 p-2 rounded-full"
                         onClick={() => handleEdit(prescription)}
                       >
                         <EditOutlined className="text-xl text-blue-500" />
                       </button>
                       <button
                         className="hover:bg-red-300 p-2 rounded-full"
                         onClick={() => handleDelete(prescription._id)}
                         aria-label="Delete prescription"
                         title="Delete prescription"
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
        <EditPrescriptionModal
          isOpen={isEditOpen}
          formData={selectedPrescription}
          onClose={handleCloseModal}
          onUpdate={handleUpdate}
        />
        <ToastContainer />
      </div>
    </div>
  );
}
