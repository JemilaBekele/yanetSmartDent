"use client"; // Ensures this component is client-side rendered

import React, { useEffect, useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import Link from "next/link";
import { EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import CreaditEditModal from "@/app/components/invoice/creaditEditModal";
import { Creadit } from "@/types/creadit"; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from 'next-auth/react';
import { Patient } from "../../Invoice/all/allinvoice";
import { toWords } from 'number-to-words';
import { jsPDF } from "jspdf";

type InvoiceFormProps = {
  params: {
    id: string;
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "text-green-500 bg-green-100";
    case "Pending":
      return "text-yellow-500 bg-yellow-100";
    case "Cancel":
      return "text-red-500 bg-red-100";
    case "Credit":
      return "text-blue-500 bg-blue-100";
    default:
      return "text-gray-500 bg-gray-100";
  }
};

export default function CreaditAll({ params }: InvoiceFormProps) {
  const patientId = params.id;
  const { data: session } = useSession(); 
  
  const [creadit, setCreadit] = useState<Creadit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedCreadit, setSelectedCreadit] = useState<Creadit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  const role = useMemo(() => session?.user?.role || '', [session]);

  useEffect(() => {
    // Define the fetchInvoices function inside useEffect to avoid redeclaration on every render
    const fetchCreadit = async () => {
      try {
        const response = await axios.get(`/api/Creadit/payment/${patientId}`);
        if (response.data.success) {
          const { patient, Credit } = response.data.data;
  
          // Ensure Credit is an array before setting it
          if (Array.isArray(Credit)) {
            setPatient(patient);
            setCreadit(Credit);
          } else {
            console.error("Expected an array but got:", Credit);
            setError("Invalid data format received from the server.");
          }

        } else {
          setError("Failed to fetch Credits and card data.");
        }
      } catch (error) {
        setError("Failed to fetch Creadit");
      } finally {
        setLoading(false);
      }
    };

    fetchCreadit();
  }, [patientId]); // patientId is a dependency since it may change

  const handleEdit = (creadit: Creadit) => {
    setSelectedCreadit(creadit);
    setModalVisible(true);
  };

  const handleSave = (updatedInvoice: Partial<Creadit>) => {
    if (!selectedCreadit) return;

    // Update the invoice locally
    setCreadit((prevCreadit) =>
      prevCreadit.map((inv) =>
        inv._id === selectedCreadit._id ? { ...inv, ...updatedInvoice } : inv
      )
    );
    setModalVisible(false);

    // Re-fetch invoices after updating
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`/api/Creadit/payment/${patientId}`);
        const data = await response.json();
        console.log(data)
        if (response.ok) {
          setCreadit(data.data.Credit);
        } else {
          setError(data.error || "Failed to fetch invoices");
        }
      } catch (error) {
        setError("Failed to fetch invoices");
      }
    };
    fetchInvoices();
  };

  const generatePDF = (item: Creadit[], patientData: Patient, invoice: any) => {
    const doc = new jsPDF();
  
    const formattedDate = item[0]?.createdAt
      ? new Date(item[0].createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "N/A";
  
    const formattedTime = item[0]?.createdAt
      ? new Date(item[0].createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "N/A";
  
    // Header Section with Image and Title
    const logoPath = "/assets/file.png";
    const imgWidth = 30, imgHeight = 20;
    doc.addImage(logoPath, "JPEG", 10, 10, imgWidth, imgHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
  
    // Set the light red color for the main title text
    doc.setTextColor(59, 114, 182); // Light Red
    doc.text("Yanet Special Dental Clinic", 109, 24, { align: "center" });
    doc.setFontSize(18);
    // doc.setTextColor(89, 154, 222);
    // doc.text("", 105, 26, { align: "center" });
  
    // Set the font for the subheading
    // doc.setFont("helvetica", "bold");
    // doc.setFontSize(14);
    // doc.text("", 105, 35, { align: "center" });
  
    // Styled Line Below Header
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(1.5);
    doc.line(10, 40, 200, 40);
  
doc.setDrawColor(39, 235, 245);  // Yellow
    doc.line(10, 42, 200, 42);
  
    // Patient Information Section
    const startY = 57;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Cash Sales Attachment", 105, 50, { align: "center" });
  
    // Left Side Information
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Left Side Information
    doc.text(`From: `, 10, startY);
    doc.text(`Address:  A.A Bole`, 10, startY + 7);
    doc.text(`Supplier's TIN No: `, 10, startY + 14);
    doc.text(`Date of Registration`, 10, startY + 21);
  
    // Right Side Information
    const rightStartX = 140; // Right side starting X coordinate for alignment
    doc.text(`FS No. ______________________`, rightStartX, startY);
    doc.text(`Date: ${formattedDate}`, rightStartX, startY + 7);
    doc.text(`Time: ${formattedTime}`, rightStartX, startY + 14);
    doc.text(`Buyer's Name: ${patientData.firstname || ""}`, rightStartX, startY + 21);
    doc.text(`Buyer's Trade Name: ${""}`, rightStartX, startY + 28);
    doc.text(`Buyer's TIN: ${""}`, rightStartX, startY + 35);
    doc.text(`Address: Zone/Ketema: ${patientData.Town || ""}`, rightStartX, startY + 42);
    doc.text(`Kebele: ${patientData.KK || ""}`, rightStartX, startY + 49);
    doc.text(`House No: ${patientData.HNo || ""}`, rightStartX, startY + 56);
  
    
    // Invoice Table
    const tableStartY = startY + 70;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  
    // Draw the table headers
    doc.text("Description", 20, tableStartY);
    doc.text("Unit", 80, tableStartY);
    doc.text("Quantity", 100, tableStartY);
    doc.text("Unit Price", 140, tableStartY);
    doc.text("Amount", 180, tableStartY);
  
    // Draw the table structure lines (header and row borders)
    doc.setDrawColor(0, 0, 0); // Black color for table lines
    doc.setLineWidth(0.5); // Line width
  
    // Draw the header bottom line
    doc.line(10, tableStartY + 2, 200, tableStartY + 2);  // Draw line below header row
  
    let currentY = tableStartY + 7;
  
    // Draw table rows and borders
    invoice.items.forEach((item: any, index: number) => {
      // Draw the service name and quantity
      doc.text(`${item.service.service ? item.service.service.replace(/\(.*?\)/g, "").trim() : ""}`, 20, currentY);
  
      // Draw the price per unit, quantity, and total price
      doc.text(``, 80, currentY);
      doc.text(`${item?.quantity || 0}`, 100, currentY);
      doc.text(`${item.price.toFixed(2) || 0}`, 140, currentY);
      doc.text(`${item.totalPrice.toFixed(2) || 0}`, 180, currentY);
  
      // Draw row lines to separate the items
      doc.line(10, currentY + 2, 200, currentY + 2);  // Draw line under each row
  
      currentY += 7;
    });
  
  

  // Payment Info Section: Mode of Payment (Cash / Cheque), Cheque No, and Total Amount
  const totalAmountInWords = toWords(invoice.totalAmount );
  const totalAmountY = currentY + 10;
  
    doc.setFont("helvetica", "normal");
  
    // First Column: Payment Mode (Cash/Check)
    doc.text("Mode of Payment", 20, totalAmountY);
    doc.text("Cash", 55, totalAmountY);
    doc.rect(65, totalAmountY-3, 4, 4); 
  
    // Second Column: Cheque Number
    doc.text("Cheque No", 80, totalAmountY);
    doc.text("____________", 100, totalAmountY);
  
    // Third Column: Total Amount in Numbers
    doc.text("Total Amount:", 145, totalAmountY );
    doc.text((invoice.totalAmount ).toFixed(2), 170, totalAmountY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    // Add the total amount in words below
    const totalAmountWordsY = totalAmountY + 14;
    const backgroundHeight = 8;  // Height of the background
    doc.setFillColor(200, 200, 200); // Set gray color for the background
    doc.rect(41, totalAmountWordsY - 4, 160, backgroundHeight, 'F');  // Fill a rectangle with gray
  
    // Set text color to black for the text itself
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(`In words: ${totalAmountInWords.charAt(0).toUpperCase() + totalAmountInWords.slice(1)}`, 20, totalAmountWordsY);
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    // New row with two columns: Prepared by and Cashier Signature
    const signatureRowY = totalAmountWordsY + 10;
  
    // First column: Prepared by
    doc.text(`Prepared by: ${name} `, 20, signatureRowY);
    doc.text("Signature: ____________", 20, signatureRowY+10);
  
    // Second column: Cashier Signature
    doc.text("Cashier Signature:", 80, signatureRowY);
    doc.text("____________", 80, signatureRowY+10);
    // Footer Section
    const footerY = doc.internal.pageSize.height - 20;
    doc.setDrawColor(89, 154, 222);
    doc.setLineWidth(0.7);
    doc.line(10, footerY, 200, footerY);
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for choosing Yanet Special Dental Clinic", 105, footerY + 5, {
      align: "center",
    });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Contact: 091 199 7804 | 0904455555", 105, footerY + 10, {
      align: "center",
    });
    doc.text(
      "Address: Bole medanealem Addis Ababa, Ethiopia",
      105,
      footerY + 15,
      { align: "center" }
    );
  
    // Save PDF
    doc.save(`Credit${patientData.firstname}.pdf`);
  };
  
const handleDelete = async (creaditId: string) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this credit? This action cannot be undone."
  );

  if (!confirmDelete) {
    return; // Exit if the user cancels the action
  }

  const toastId = toast.loading("Deleting credit...");

  try {
    const response = await axios.delete(`/api/Creadit/payment/detail/${creaditId}`, {
      data: { creaditId },
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.data.success) {
      setCreadit((prevCreadit) =>
        prevCreadit.filter((credit) => credit._id !== creaditId)
      );
      toast.update(toastId, {
        render: "Credit deleted successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } else {
      toast.update(toastId, {
        render: response.data.error || "Failed to delete the credit.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Failed to delete the credit:", response.data.error);
    }
  } catch (err) {
    toast.update(toastId, {
      render: "An unexpected error occurred while deleting the credit.",
      type: "error",
      isLoading: false,
      autoClose: 3000,
    });
    console.error("Error deleting credit:", err);
  }
};


  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  return (
    <div className="flex ml-7 mt-7">
      <div className="flex-grow md:ml-60 container mx-auto">
        <div className="flex space-x-4">
          <div className="w-1/3">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-8 rounded-lg shadow-md">
            <header className="text-center mb-6">
              <h1 className="text-3xl font-bold">Credit</h1>
            </header>

            <div className="mt-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Credit</h2>
                {role === 'admin' && (
                  <Link
                    href={`/admin/creadit/add/${patientId}`}
                    className="bg-green-500 text-white mb-4 px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    New Credit +
                  </Link>
                )}
                {role === 'doctor' && (
                  <Link
                    href={`/doctor/creadit/add/${patientId}`}
                    className="bg-green-500 text-white mb-4 px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    New Credit +
                  </Link>
                )}
                   
              </div>
              {creadit.length === 0 ? (
                <p className="text-center text-gray-500">No Credit available for this patient.</p>
              ) : (
                <div className="space-y-4">
                  {creadit.map((creadit) => (
                    <div
                      key={creadit._id}
                      className="p-6 border rounded-lg shadow bg-gray-50 hover:shadow-lg transition-shadow relative"
                    >
              
                        <div className="absolute top-2 right-2 space-x-2">
                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          onClick={() => patient && generatePDF([creadit], patient, creadit)}
                        >
                          <DownloadOutlined /> 
                        </button>
                          <EditOutlined
                            onClick={() => handleEdit(creadit)}
                            className="text-blue-500 pr-4 pl-4 cursor-pointer hover:text-blue-700"
                            aria-label="Edit creadit"
                          />
                                  {(role === 'admin') && (
                          <DeleteOutlined
                            onClick={() => handleDelete(creadit._id)}
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            aria-label="Delete creadit"
                          />         )}
                        </div>
             

                      <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                          <strong className="text-green-400">  Branch:</strong>{" "}
                          <span className="text-green-500">
                            {creadit?.branch?.name}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Credit Date:</strong>{" "}
                          <span className="text-gray-900">
                            {new Date(creadit.creditDate).toLocaleDateString() || "Unknown"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Total Amount:</strong>{" "}
                          <span className="text-gray-900">
                            {creadit.totalAmount ? creadit.totalAmount.toFixed(2) : "0.00"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Total Paid:</strong>{" "}
                          <span className="text-gray-900">
                            {creadit.totalPaid ? creadit.totalPaid.toFixed(2) : "0.00"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Balance:</strong>{" "}
                          <span className="text-gray-900">
                            {creadit.balance ? creadit.balance.toFixed(2) : "0.00"}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Current Payment:</strong>{" "}
                          <span className="text-gray-900">{creadit.balance ? creadit.currentPayment.amount.toFixed(2): "0.00"}</span>
                        </div>
                        
                        <div>
                          <strong className="text-gray-700">Order By:</strong>{" "}
                          <span className="text-gray-900">{creadit.createdBy?.username || "Unknown"}</span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Status:</strong>{" "}
                          <span className={`text-sm font-bold py-1 px-3 rounded ${getStatusColor(creadit.status)}`}>
                            {creadit.status}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">Items</h3>
                      <div className="overflow-y-auto h-48">
                        <ul className="space-y-3">
                          {creadit?.items.map((item, index) => (
                            <li key={index} className="flex justify-between items-start bg-gray-100 p-3 rounded-lg shadow-sm">
                              <div>
                                <div className="font-medium text-gray-800">
                                  {item.service.service} (x{item.quantity})
                                </div>
                                <div className="text-gray-600">Description: {item.description}</div>
                                <div className="text-gray-600">Price per unit: {item.price ? item.price.toFixed(2) : "0.00"}</div>
                              </div>
                              <span className="text-lg font-bold text-gray-800">
                                {item.totalPrice ? item.totalPrice.toFixed(2) : "0.00"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <CreaditEditModal
                        visible={isModalVisible}
                        onClose={() => setModalVisible(false)}
                        credit={selectedCreadit}
                        onSave={handleSave}
                        patientId={patientId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}