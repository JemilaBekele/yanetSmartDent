"use client"; // Ensures this component is client-side rendered
import { toWords } from 'number-to-words';
import React, { useEffect, useState, useMemo } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import Link from "next/link";
import { EditOutlined, DeleteOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "axios";
import { Invoice } from "@/types/invotwo"; 
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from 'next-auth/react';
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import PerfoEditModal from './eidit';

type InvoiceFormProps = {
  params: {
    id: string;
  };
};

export type Patient = {
  id: string;
  firstname: string;
  age: number;
  phoneNumber: string;
  sex: string;
  cardno: string;
  Town: string;
  KK: string;
  HNo: string;
  updatedAt: string;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "text-green-500 bg-green-100";
    case "Pending":
      return "text-yellow-500 bg-yellow-100";
    case "Cancel":
      return "text-red-500 bg-red-100";
    case "order":
      return "text-blue-500 bg-blue-100";
    default:
      return "text-gray-500 bg-gray-100";
  }
};

export default function PerformaPage({ params }: InvoiceFormProps) {
  const patientId = params.id;
  const { data: session } = useSession(); 
  const [invoices, setInvoices] = useState<Invoice[]>([]); // Initialize as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [cardPriceLastPart, setCardPriceLastPart] = useState<number | null>(null);
  const [includeCardPrice, setIncludeCardPrice] = useState<boolean>(false); // New state for including card pr
  const role = useMemo(() => session?.user?.role || '', [session]);
  const name = useMemo(() => session?.user?.username || '', [session]);

  useEffect(() => {
    const fetchInvoicesAndCard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/Performa/${patientId}`);
        console.log("API Response:", response.data);
  
        if (response.data.success) {
          const { patient, Perfo, lastCardPrice } = response.data.data;
  
          // Ensure Invoice is an array before setting it
          if (Array.isArray(Perfo)) {
            setPatient(patient);
            setInvoices(Perfo);
          } else {
            console.error("Expected an array but got:", Perfo);
            setError("Invalid data format received from the server.");
          }

          // Set the last card price
          setCardPriceLastPart(lastCardPrice);
        } else {
          setError("Failed to fetch invoices and card data.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchInvoicesAndCard();
  }, [patientId]);
  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const handleSave = (updatedInvoice: Partial<Invoice>) => {
    if (!selectedInvoice) return;

    // Update the invoice locally
    setInvoices((prevInvoices) =>
      prevInvoices.map((inv) =>
        inv._id === selectedInvoice._id ? { ...inv, ...updatedInvoice } : inv
      )
    );
    setModalVisible(false);

    // Re-fetch invoices after updating
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`/api/Performa/${patientId}`);
        const data = await response.json();
        if (response.ok) {
          setInvoices(data.data.Perfo); // Ensure the correct structure
        } else {
          setError(data.error || "Failed to fetch invoices");
        }
      } catch (error) {
        setError("Failed to fetch invoices");
      }
    };
    fetchInvoices();}



const generatePDF = (item: Invoice[], patientData: Patient, invoice: any) => {
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
    const name = invoice.createdBy?.username || "Unknown";

    // Header Section with Image and Title
    const logoPath = "/assets/file.png";
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
      doc.setTextColor(0, 0, 0); // Black for subheading for contrast

    // Set the font for the subheading
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("", 105, 35, { align: "center" });
  
    // Styled Line Below Header
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(1.5);
    doc.line(10, 40, 200, 40);
  
doc.setDrawColor(39, 235, 245); // Yellow
    doc.line(10, 42, 200, 42);
  
    // Patient Information Section
    const startY = 57;
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Proforma ", 105, 50, { align: "center" });
  
    // Left Side Information
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Left Side Information
    doc.text(`Patient Name:${patientData.firstname || ""}`, 10, startY);
    doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 7);
    doc.text(`Card No: ${patientData.cardno}`, 10, startY + 14);
    doc.text(`Date of Registration`, 10, startY + 21);
  
    // Right Side Information
    const rightStartX = 140; // Right side starting X coordinate for alignment
    doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, rightStartX, startY);
    doc.text(`Age: ${patientData.age} yrs`, rightStartX, startY + 7);
   
    
    // Invoice Table
    const tableStartY = startY + 40;
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
  
    // Add card price as a separate row if includeCardPrice is true
    if (includeCardPrice && cardPriceLastPart !== null) {
      doc.text("Card Price", 20, currentY);
      doc.text("1", 100, currentY); // Quantity is 1
      doc.text(`${cardPriceLastPart.toFixed(2)}`, 140, currentY); // Unit price
      doc.text(`${cardPriceLastPart.toFixed(2)}`, 180, currentY); // Total price

      // Draw row lines to separate the items
      doc.line(10, currentY + 2, 200, currentY + 2);  // Draw line under each row

      currentY += 7;
    }

    // Payment Info Section: Mode of Payment (Cash / Cheque), Cheque No, and Total Amount
    const totalAmountY = currentY + 10;
    
    doc.setFont("helvetica", "normal");
  
    // Third Column: Total Amount in Numbers
    doc.text("Total Amount:", 145, totalAmountY);
    doc.text((invoice.totalAmount + (includeCardPrice && cardPriceLastPart ? cardPriceLastPart : 0)).toFixed(2), 170, totalAmountY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
  
    // Set text color to black for the text itself
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    // Signature section - positioned after the table and total amount
    const signatureY = totalAmountY + 20;
    
    // Add signature image if the name is "Dr Tedla Tessema"
    const namesign = name === "Dr Tedla Tessema";
    if (namesign) {
      try {
        const doctorImagePath = "/assets/sign.png";
        doc.addImage(doctorImagePath, "JPEG", 40, signatureY, 40, 20);
        doc.text("Dr Tedla Tesema", 40, signatureY + 25);
      } catch(e) {
        console.error("Error adding signature image to PDF:", e);
        doc.text("Signature: _________________________", 10, signatureY);
        doc.text("Dr jemu Tesema", 10, signatureY + 10);
      }
    } else {
      doc.text("Signature: _________________________", 10, signatureY);
      doc.text(name, 10, signatureY + 10);
    }

    // Add date below the signature
    doc.text(`Date: ${formattedDate}`, 10, signatureY + 30);
    doc.text(`Note: This is not invoice it just a Proforma `, 10, signatureY + 35);

    // Footer Section
    const footerY = doc.internal.pageSize.height - 20;
    doc.setDrawColor(6, 21, 97);
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
    doc.save(`Invoice_${patientData.firstname}.pdf`);
  };





  const handleDelete = async (invoiceId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this invoice? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const toastId = toast.loading("Deleting invoice...");
    try {
      const response = await axios.delete(`/api/Performa/detail/${invoiceId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        data: { invoiceId },
      });

      if (response.data.success) {
        setInvoices((prevInvoices) =>
          prevInvoices.filter((invoice) => invoice._id !== invoiceId)
        );
        toast.update(toastId, {
          render: "Invoice deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: response.data.error || "Failed to delete the invoice.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.update(toastId, {
        render: "An unexpected error occurred while deleting the invoice.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
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
<h1 className="text-2xl font-bold">Proforma Records</h1>
              <p className="text-gray-600 capitalize mt-1">
                {invoices.length > 0 ? invoices[0].customerName.username : "Patient"}
              </p>
            </header>

            <div className="mt-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Proforma Records</h2>
                  {(role === "doctor" || role === "admin") && patientId && (
                  <Link
                    href={role === "doctor" ? `/doctor/Performa/add/${patientId}` : `/admin/Performa/add/${patientId}`}
                    className="bg-green-500 text-white px-4 py-2 mb-4 rounded-md hover:bg-green-600"
                  >
                    New Proforma +
                  </Link>
                )}
              </div>
              {invoices.length === 0 ? (
                <p className="text-center text-gray-500">No Proforma available for this patient.</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice._id}
                      className="p-6 border rounded-lg shadow bg-gray-50 hover:shadow-lg transition-shadow relative"
                    >
                      <div className="absolute top-2 right-2 space-x-2">
     

                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                          onClick={() => patient && generatePDF([invoice], patient, invoice)}
                        >
                          <DownloadOutlined /> 
                        </button>
                        <EditOutlined
                          onClick={() => handleEdit(invoice)}
                          className="text-blue-500 pr-4 pl-4 cursor-pointer hover:text-blue-700"
                          aria-label="Edit Invoice"
                        />
                        {(role === "doctor" || role === "admin" ) && (
                          <DeleteOutlined
                            onClick={() => handleDelete(invoice._id)}
                            className="text-red-500 cursor-pointer hover:text-red-700"
                            aria-label="Delete Invoice"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <strong className="text-gray-700">Proforma Date:</strong>{" "}
                          <span className="text-gray-900">
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Total Amount:</strong>{" "}
                          <span className="text-gray-900">{invoice.totalAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <strong className="text-gray-700">Created By:</strong>{" "}
                          <span className="text-gray-900">{invoice.createdBy?.username || "Unknown"}</span>
                        </div>
                        <div>
                        </div>
                      </div>

                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2 mb-4">Items</h3>
                     <div className="overflow-y-auto h-48">
  <table className="min-w-full text-left border border-gray-200">
    <thead className="bg-gray-100 sticky top-0">
      <tr>
        <th className="px-4 py-2 text-sm font-semibold text-gray-700">Service</th>
        <th className="px-4 py-2 text-sm font-semibold text-gray-700">Description</th>
        <th className="px-4 py-2 text-sm font-semibold text-gray-700">Qty</th>
        <th className="px-4 py-2 text-sm font-semibold text-gray-700">Unit Price</th>
        <th className="px-4 py-2 text-sm font-semibold text-gray-700">Total</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {invoice?.items.map((item, index) => (
        <tr key={index} className="bg-white hover:bg-gray-50">
          <td className="px-4 py-2 text-gray-800">{item?.service?.service}</td>
          <td className="px-4 py-2 text-gray-600">{item?.description}</td>
          <td className="px-4 py-2 text-gray-800">{item?.quantity}</td>
          <td className="px-4 py-2 text-gray-800">{item?.price.toFixed(2)}</td>
          <td className="px-4 py-2 font-bold text-gray-900">{item?.totalPrice.toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

                      <PerfoEditModal
                        visible={isModalVisible}
                        onClose={() => setModalVisible(false)}
                        invoice={selectedInvoice}
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