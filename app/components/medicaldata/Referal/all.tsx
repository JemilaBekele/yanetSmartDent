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
import EditReferralModal from "./edit";
import { branch } from "../Consent/all";

type ReferralData = {
  _id: string;
  HPI: string;
  PysicalFindings: string;
  InvestigationResult: string;
  Diagnosis: string;
  ReasonForReferral: string;
  Referring: string;
  Physical: string;
  branch: branch;
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

export default function ReferralPage({ params }: ReferralPageProps) {
  const patientId = params.id;
  const { data: session } = useSession();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<ReferralData | null>(null);
  const role = useMemo(() => session?.user?.role || "", [session]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`/api/Referal/${patientId}`);

        if (response.data.success) {
          const { patient, ReferalCertificate } = response.data.data;
          setPatientData(patient);
          setReferrals(ReferalCertificate);
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
      const response = await axios.patch(`/api/Referal/detail/${data._id}`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data.success) {
        setReferrals((prev) =>
          prev.map((ref) => (ref._id === data._id ? response.data.data : ref))
        );
        toast.success("Referral updated successfully!");
      } else {
        toast.error(response.data.error || "Failed to update referral.");
      }
    } catch (error) {
      console.error("Error updating referral:", error);
      toast.error("An unexpected error occurred.");
    } finally {
      setIsEditOpen(false);
    }
  };

  const handleDelete = async (referralId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this referral?");
    if (!confirmDelete) return;

    try {
      const response = await axios.delete(`/api/Referal/detail/${referralId}`);
      if (response.data.success) {
        setReferrals((prev) => prev.filter((ref) => ref._id !== referralId));
        toast.success("Referral deleted successfully!");
      } else {
        toast.error(response.data.error || "Failed to delete referral.");
      }
    } catch (error) {
      console.error("Error deleting referral:", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const generatePDF = (referral: ReferralData, patientData: PatientData) => {
    const formattedDate = new Date(referral.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  
    const doc = new jsPDF();
    const name = referral.createdBy?.username || "Unknown";
    const logoPath = "/assets/file.png"; // Path to your logo image
    const imgWidth = 40, imgHeight = 30;
  
    doc.addImage(logoPath, "JPEG", 10, 7, imgWidth, imgHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(59, 114, 182); // Light Red
    doc.text("Yanet Special Dental Clinic ", 109, 24, { align: "center" });
    doc.setFontSize(18);
    // doc.setTextColor(89, 154, 222);
    // doc.text("", 105, 26, { align: "center" });
        doc.setTextColor(0, 0, 0); // Black for subheading for contrast

    doc.setFontSize(16);
    doc.text("Referral Letter", 105, 35, { align: "center" });
  
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(1.5);
    doc.line(10, 40, 200, 40);
doc.setDrawColor(39, 235, 245); // Yellow
    doc.line(10, 42, 200, 42);
  
    const startY = 50;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  
    doc.text(`Patient Name: ${patientData.firstname}`, 10, startY);
    doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 7);
    doc.text(`Card No: ${patientData.cardno}`, 10, startY + 14);
    doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, 140, startY);
    doc.text(`Age: ${patientData.age} yrs`, 140, startY + 7);
    doc.text(`Date: ${formattedDate}`, 140, startY + 14);
  
    let prescriberY = startY + 35;
    const sectionPadding = 10;
    const boxMargin = 5;
  
    doc.setFont("helvetica", "bold");
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(14);
    doc.text("Referral Information", 10, prescriberY + 2);
    doc.setFontSize(10);
  
    let contentHeight = 0;
    contentHeight += referral.HPI ? 7 : 0;
    contentHeight += referral.PysicalFindings ? 7 : 0;
    contentHeight += referral.InvestigationResult ? 7 : 0;
    contentHeight += referral.Diagnosis ? 7 : 0;
    contentHeight += referral.ReasonForReferral ? 7 : 0;
    contentHeight += referral.Referring ? 7 : 0;
    contentHeight += referral.Physical ? 7 : 0;
    contentHeight += 7 * 4;
  
    const boxHeight = contentHeight + 70;
  
    doc.setDrawColor(93, 116, 122);
    doc.setLineWidth(0.7);
    doc.rect(5, prescriberY - boxMargin, 200, boxHeight);
  
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
  
    if (referral.HPI) {
      const hpiText = `HPI: ${referral.HPI}`;
      const wrappedHPI = doc.splitTextToSize(hpiText, 190);
      doc.text(wrappedHPI, 10, prescriberY + sectionPadding);
      prescriberY += wrappedHPI.length * 5;
    }
  
    if (referral.PysicalFindings) {
      const findingsText = `Physical Findings: ${referral.PysicalFindings}`;
      const wrappedFindings = doc.splitTextToSize(findingsText, 190);
      doc.text(wrappedFindings, 10, prescriberY + 14);
      prescriberY += wrappedFindings.length * 5;
    }
  
    if (referral.InvestigationResult) {
      const investigationText = `Investigation Result: ${referral.InvestigationResult}`;
      const wrappedInvestigation = doc.splitTextToSize(investigationText, 190);
      doc.text(wrappedInvestigation, 10, prescriberY + 14);
      prescriberY += wrappedInvestigation.length * 5;
    }
  
    if (referral.Diagnosis) {
      const diagnosisText = `Diagnosis: ${referral.Diagnosis}`;
      const wrappedDiagnosis = doc.splitTextToSize(diagnosisText, 190);
      doc.text(wrappedDiagnosis, 10, prescriberY + 14);
      prescriberY += wrappedDiagnosis.length * 5;
    }
  
    if (referral.ReasonForReferral) {
      const reasonText = `Reason for Referral: ${referral.ReasonForReferral}`;
      const wrappedReason = doc.splitTextToSize(reasonText, 190);
      doc.text(wrappedReason, 10, prescriberY + 14);
      prescriberY += wrappedReason.length * 5;
    }
  
    if (referral.Referring) {
      const referringText = `Referring: ${referral.Referring}`;
      const wrappedReferring = doc.splitTextToSize(referringText, 190);
      doc.text(wrappedReferring, 10, prescriberY + 14);
      prescriberY += wrappedReferring.length * 5;
    }
  
    if (referral.Physical) {
      const physicalText = `Physical: ${referral.Physical}`;
      const wrappedPhysical = doc.splitTextToSize(physicalText, 190);
      doc.text(wrappedPhysical, 10, prescriberY + 14);
      prescriberY += wrappedPhysical.length * 5;
    }
  
    prescriberY += boxHeight + 5;
    const namesign = name === "Dr Tedla Tessema";
    if (namesign) {
      const doctorImagePath = "/assets/sign.png";
      const imageWidth = 40;
      const imageHeight = 20;
      doc.addImage(doctorImagePath, "JPEG", 39, 248, imageWidth, imageHeight);
    }
  
    doc.text(`Doctor’s Name: ${referral.createdBy?.username}`, 10, 250);
    doc.text("Signature: _________________________", 10, 255);
    doc.text(`Date: ${formattedDate}`, 10, 260);
  
    const footerY = doc.internal.pageSize.height - 30;
    doc.setDrawColor(6, 21, 97);
    doc.setLineWidth(0.7);
    doc.line(10, footerY, 200, footerY);
  
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for choosing Yanet Special Dental Clinic ", 105, footerY + 5, {
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
    doc.text("Address: Bole medanealem, Addis Ababa, Ethiopia", 105, footerY + 20, {
      align: "center",
    });
  
    doc.save(`Referral_Letter_${patientData.firstname}.pdf`);
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
              <h1 className="text-2xl font-bold">Referral Letters</h1>
              {role === "doctor" && (
                <Link
                  href={`/doctor/referral/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Referral +
                </Link>
              )}
              {role === "admin" && (
                <Link
                  href={`/admin/referral/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Referral +
                </Link>
              )}
            </div>

            {isLoading ? (
              <p className="text-gray-500">Loading referrals...</p>
            ) : referrals.length === 0 ? (
              <p className="text-gray-500">No referrals available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {referrals.map((referral) => (
                  <div
                    key={referral._id}
                    className="border p-4 rounded-lg shadow-md flex items-start justify-between"
                  >
                    <div className="flex flex-col space-y-2"> 
                       <div className="text-green-400 text-base">
                        Branch: {referral.branch?.name || "Unknown"}
                      </div>
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
  <p>HPI: {referral.HPI}</p>
  <p>Physical Findings: {referral.PysicalFindings}</p>
  <p>Investigation Result: {referral.InvestigationResult}</p>
  <p>Diagnosis: {referral.Diagnosis}</p>
  <p>Reason for Referral: {referral.ReasonForReferral}</p>
  <p>Referring: {referral.Referring}</p>
  <p>Physical: {referral.Physical}</p>
</div>

                    <div className="flex flex-col space-y-2">
                      <button
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        onClick={() => patientData && generatePDF(referral, patientData)}
                      >
                        <DownloadOutlined />
                      </button>
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

        <EditReferralModal
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