"use client";

import React, { useState, useEffect, useMemo } from "react";
import PatientComponent, { Patient } from "@/app/components/patient/PatientComponent";
import { DeleteOutlined, EditOutlined, FilePdfOutlined } from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import jsPDF from 'jspdf';

import { 
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';

type TreatmentCategory = {
  // ✅ General Treatments
  Extraction?: boolean;
  Scaling?: boolean;
  Rootcanal?: boolean;
  Filling?: boolean;
  Bridge?: boolean;
  Crown?: boolean;
  Apecectomy?: boolean;
  Fixedorthodonticappliance?: boolean;
  Removableorthodonticappliance?: boolean;
  Removabledenture?: boolean;
  Splinting?: boolean;

  // ✅ Restorative Dentistry
  Restorative?: {
    AmalgamFilling?: boolean;
    CompositeFilling?: boolean;
    GlassIonomer?: boolean;
    TemporaryFilling?: boolean;
    CrownPreparation?: boolean;
    CrownCementation?: boolean;
    VeneerPlacement?: boolean;
    CoreBuildUp?: boolean;
    OnlayInlay?: boolean;
    ToothRecontouring?: boolean;
    other?: string;
  };

  // ✅ Endodontics
  Endodontic?: {
    RootCanalTreatment?: boolean;
    ReRootCanalTreatment?: boolean;
    PulpCappingDirect?: boolean;
    PulpCappingIndirect?: boolean;
    Pulpectomy?: boolean;
    Pulpotomy?: boolean;
    Apexification?: boolean;
    Apicoectomy?: boolean;
    RootCanalPost?: boolean;
    other?: string;
  };

  // ✅ Implant / Maxillofacial
  ImplantMaxillofacial?: {
    ImplantPlacement?: boolean;
    BoneGraft?: boolean;
    RidgeAugmentation?: boolean;
    SinusLift?: boolean;
    SoftTissueGraft?: boolean;
    ImplantExposure?: boolean;
    ImplantCrownDelivery?: boolean;
    MaxillofacialFractureRepair?: boolean;
    TMJDisorderManagement?: boolean;
    other?: string;
  };

  // ✅ Cosmetic / Aesthetic Dentistry
  CosmeticAesthetic?: {
    TeethWhiteningOffice?: boolean;
    TeethWhiteningHomeKit?: boolean;
    CompositeBonding?: boolean;
    DiastemaClosure?: boolean;
    VeneerPorcelain?: boolean;
    SmileMakeover?: boolean;
    GumContouring?: boolean;
    GingivalDepigmentation?: boolean;
    EnamelMicroabrasion?: boolean;
    ToothJewelry?: boolean;
    other?: string;
  };

  // ✅ Prosthodontics
  Prosthodontic?: {
    CompleteDenture?: boolean;
    PartialDenture?: boolean;
    FlexibleDenture?: boolean;
    ImplantSupportedOverdenture?: boolean;
    FixedPartialDenture?: boolean;
    CrownAndBridgeMaintenance?: boolean;
    ReliningRebasing?: boolean;
    DentureRepair?: boolean;
    OcclusalAdjustment?: boolean;
    NightGuardFabrication?: boolean;
    other?: string;
  };

  // ✅ Orthodontics
  Orthodontic?: {
    FixedAppliance?: boolean;
    RemovableAppliance?: boolean;
    RetainerPlacement?: boolean;
    BracketBonding?: boolean;
    WireChange?: boolean;
    Debonding?: boolean;
    SpaceMaintainer?: boolean;
    InterceptiveTreatment?: boolean;
    other?: string;
  };

  // ✅ Extra details per tooth
  ToothNumber?: string;
  Surface?: string;
  Quadrant?: string;
  Note?: string;
};

type disease = {
  _id: string;
  disease: string;
};
type branch ={
  __id: string;
  branchName: string;
}
type MedicalRecordData = {
  _id: string;
  Recommendation: string;
  ChiefComplaint: {
    None?: boolean;
    ImproveMySmile?: boolean;
    CrookedTeeth?: boolean;
    Crowding?: boolean;
    Spacing?: boolean;
    Crown?: boolean;
    Overbite?: boolean;
    Underbite?: boolean;
    Deepbite?: boolean;
    Crossbite?: boolean;
    ImpactedTeeth?: boolean;
    other?: string;
  };
  DentalHistory: {
    None?: boolean;
    PreviousOrthodonticTreatment?: boolean;
    MissingTooth?: boolean;
    UnderSizedTooth?: boolean;
    Attrition?: boolean;
    ImpactedTooth?: boolean;
    other?: string;
  };
  PhysicalExamination: string;
  HistoryPresent: string;
  PresentCondition: string;
  DrugAllergy: string;
  Diagnosis: string;
  IntraoralExamination: string;
  ExtraoralExamination: string;
  Investigation: string;
  Assessment: string;
  NextProcedure: string;
  TreatmentPlan: TreatmentCategory[] | null;
  TreatmentDone: TreatmentCategory[] | null;
  diseases: disease[] | null;
  branch: branch,
  createdAt?: string;
  changeHistory?: { updatedBy: { username: string }; updateTime: string }[];
  updatedAt?: string;
  createdBy?: { username: string };
};

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};

const generateMedicalHistoryPDF = (item: MedicalRecordData[], patientData: Patient) => {
  const doc = new jsPDF();

  const formattedDate = item[0]?.createdAt
    ? new Date(item[0].createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const name = item[0]?.createdBy?.username || "Unknown";

  // ========== HEADER ==========
  const logoPath = "/assets/file.png";
  const imgWidth = 40, imgHeight = 30;
  doc.addImage(logoPath, "JPEG", 10, 7, imgWidth, imgHeight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(6, 21, 97);
  doc.text("Yanet Special Dental Clinic", 105, 24, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Dental HISTORY FORM", 105, 35, { align: "center" });

  // Decorative line
  doc.setDrawColor(6, 21, 97);
  doc.setLineWidth(1.5);
  doc.line(10, 40, 200, 40);
  doc.setDrawColor(39, 235, 245);
  doc.line(10, 42, 200, 42);

  // ========== PATIENT INFO ==========
  const startY = 47;
  doc.setFontSize(14);
  doc.text("Patient Dental History", 105, 50, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Patient Name: ${patientData.firstname} `, 10, startY);
  doc.text(`Sex: ${patientData.sex || ""}`, 10, startY + 7);
  doc.text(`Card No: ${patientData.cardno}`, 10, startY + 14);
  doc.text(`Phone Number: ${patientData.phoneNumber || ""}`, 140, startY);
  doc.text(`Age: ${patientData.age} yrs`, 140, startY + 7);
  doc.text(`Date: ${formattedDate}`, 140, startY + 14);

  // ========== COMPACT TWO COLUMN LAYOUT ==========
  let currentY = startY + 25;
  const leftColumnX = 10;
  const rightColumnX = 105;
  const columnWidth = 95;
  const lineHeight = 4.5;
  const sectionSpacing = 6;

  // Format Chief Complaint
  const formatChiefComplaint = (complaint: MedicalRecordData['ChiefComplaint']) => {
    if (!complaint) return "";
    
    const selectedComplaints = Object.entries(complaint)
      .filter(([key, value]) => value === true && key !== 'other')
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    
    if (complaint.other) {
      selectedComplaints.push(`Other: ${complaint.other}`);
    }
    
    return selectedComplaints.join(", ") || "None";
  };

  // Format Dental History
  const formatDentalHistory = (history: MedicalRecordData['DentalHistory']) => {
    if (!history) return "";
    
    const selectedHistory = Object.entries(history)
      .filter(([key, value]) => value === true && key !== 'other')
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    
    if (history.other) {
      selectedHistory.push(`Other: ${history.other}`);
    }
    
    return selectedHistory.join(", ") || "None";
  };

  // Medical sections organized in pairs for two-column layout
  const medicalSections = [
    { title: "Recommendation:", content: item[0]?.Recommendation },
    { title: "Chief Complaint:", content: formatChiefComplaint(item[0]?.ChiefComplaint) },
    { title: "Physical Examination:", content: item[0]?.PhysicalExamination },
    { title: "History Present:", content: item[0]?.HistoryPresent },
    { title: "Present Condition:", content: item[0]?.PresentCondition },
    { title: "Drug Allergy:", content: item[0]?.DrugAllergy },
    { title: "Diagnosis:", content: item[0]?.Diagnosis },
    { title: "Dental History:", content: formatDentalHistory(item[0]?.DentalHistory) },
    { title: "Intraoral Examination:", content: item[0]?.IntraoralExamination },
    { title: "Extraoral Examination:", content: item[0]?.ExtraoralExamination },
    { title: "Investigation:", content: item[0]?.Investigation },
    { title: "Assessment:", content: item[0]?.Assessment },
  ];

  // Process sections in pairs (left and right columns)
  for (let i = 0; i < medicalSections.length; i += 2) {
    const leftSection = medicalSections[i];
    const rightSection = medicalSections[i + 1];
    
    let maxHeight = 0;
    
    // Process left column section
    if (leftSection?.content) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(leftSection.title, leftColumnX, currentY);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      const wrappedText = doc.splitTextToSize(leftSection.content, columnWidth - 5);
      let sectionHeight = 4;
      
      wrappedText.forEach((line: string, index: number) => {
        doc.text(line, leftColumnX + 5, currentY + 4 + (index * lineHeight));
        sectionHeight += lineHeight;
      });
      
      maxHeight = Math.max(maxHeight, sectionHeight);
    }
    
    // Process right column section
    if (rightSection?.content) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(rightSection.title, rightColumnX, currentY);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      
      const wrappedText = doc.splitTextToSize(rightSection.content, columnWidth - 5);
      let sectionHeight = 4;
      
      wrappedText.forEach((line: string, index: number) => {
        doc.text(line, rightColumnX + 5, currentY + 4 + (index * lineHeight));
        sectionHeight += lineHeight;
      });
      
      maxHeight = Math.max(maxHeight, sectionHeight);
    }
    
    currentY += maxHeight + sectionSpacing;
  }

  // ========== COMPACT TREATMENT PLAN ==========
// ========== COMPACT TREATMENT PLAN ==========
if (item[0]?.TreatmentPlan && item[0].TreatmentPlan.length > 0) {
  currentY += 1;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Treatment Plan:", leftColumnX, currentY);
  currentY += 5;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const maxTreatmentItems = Math.min(item[0].TreatmentPlan.length, 3);
  
  for (let i = 0; i < maxTreatmentItems; i++) {
    const treatment = item[0].TreatmentPlan[i];
    
    if (!treatment) continue;
    
    // Start with treatment number
    doc.text(`${i + 1}.`, leftColumnX + 5, currentY);
    
    let hasTreatments = false;
    
    // Process General treatments
    const generalTreatments: string[] = [];
    Object.entries(treatment).forEach(([key, value]) => {
      if (value === true && !['ToothNumber', 'Surface', 'Quadrant', 'Note'].includes(key)) {
        generalTreatments.push(key.replace(/([A-Z])/g, " $1").trim());
      }
    });
    
    if (generalTreatments.length > 0) {
      doc.text(`   • General: ${generalTreatments.join(", ")}`, leftColumnX + 10, currentY);
      currentY += lineHeight;
      hasTreatments = true;
    }
    
    // Process Nested category treatments
    const categories = [
      { key: 'Restorative', name: 'Restorative' },
      { key: 'Endodontic', name: 'Endodontic' },
      { key: 'ImplantMaxillofacial', name: 'Implant/Maxillofacial' },
      { key: 'CosmeticAesthetic', name: 'Cosmetic/Aesthetic' },
      { key: 'Prosthodontic', name: 'Prosthodontic' },
      { key: 'Orthodontic', name: 'Orthodontic' }
    ];
    
    categories.forEach(category => {
      const categoryData = treatment[category.key as keyof TreatmentCategory];
      if (categoryData && typeof categoryData === 'object') {
        const categoryTreatments: string[] = [];
        
        Object.entries(categoryData).forEach(([key, value]) => {
          if (value === true && key !== 'other') {
            categoryTreatments.push(key.replace(/([A-Z])/g, " $1").trim());
          }
        });
        
        // Add "other" from categories
        if ('other' in categoryData && categoryData.other) {
          categoryTreatments.push(`Other - ${categoryData.other}`);
        }
        
        if (categoryTreatments.length > 0) {
          doc.text(`   • ${category.name}: ${categoryTreatments.join(", ")}`, leftColumnX + 10, currentY);
          currentY += lineHeight;
          hasTreatments = true;
        }
      }
    });

    // If no treatments were found, add a placeholder
    if (!hasTreatments) {
      doc.text(`   • No specific treatments selected`, leftColumnX + 10, currentY);
      currentY += lineHeight;
    }

    // Add tooth details if available
    if (treatment.ToothNumber) {
      doc.text(`   • Tooth: ${treatment.ToothNumber}`, leftColumnX + 10, currentY);
      currentY += lineHeight;
    }

    if (treatment.Surface) {
      doc.text(`   • Surface: ${treatment.Surface}`, leftColumnX + 10, currentY);
      currentY += lineHeight;
    }

    if (treatment.Quadrant) {
      doc.text(`   • Quadrant: ${treatment.Quadrant}`, leftColumnX + 10, currentY);
      currentY += lineHeight;
    }

    // Add note if available
    if (treatment.Note) {
      const shortNote = treatment.Note.length > 100 ? treatment.Note.substring(0, 100) + "..." : treatment.Note;
      const wrappedNote = doc.splitTextToSize(`   • Note: ${shortNote}`, 170);
      wrappedNote.forEach((line: string, index: number) => {
        doc.text(line, leftColumnX + 10, currentY);
        currentY += lineHeight;
      });
    }
    
    currentY += 2; // Add extra spacing between treatment entries
  }
  
  if (item[0].TreatmentPlan.length > maxTreatmentItems) {
    doc.text(`... and ${item[0].TreatmentPlan.length - maxTreatmentItems} more treatments`, leftColumnX + 5, currentY);
    currentY += lineHeight;
  }
}


  // ========== COMPACT SIGNATURES ==========
  if (currentY > 180) {
    currentY = 180;
  } else {
    currentY += 5;
  }
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  currentY += 6;
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  if (name === "Dr jrmila Tessema") {
    const doctorImagePath = "/assets/sign.png";
    doc.addImage(doctorImagePath, "JPEG", 145, currentY - 5, 40, 20);
  }
  
  currentY += 8;
 

  // ========== PATIENT AGREEMENT AND CONSENT (ABOVE FOOTER) ==========
  // Calculate position above footer
  const footerY = doc.internal.pageSize.height - 15;
  const agreementStartY = footerY - 45; // Position 45px above footer
  
  // Add a small separator line before the agreement section
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
   doc.setFont("helvetica", "normal").setFontSize(10);

  
   doc.text(`Doctor's Name: ${name}`, leftColumnX+5, agreementStartY+ 5);
  doc.text(`Date: ${formattedDate}`, leftColumnX+45, agreementStartY +5);
    doc.setFont("helvetica", "bold").setFontSize(11);

  doc.text("Patient Agreement and Consent", leftColumnX+5, agreementStartY+15);
  
  doc.setFont("helvetica", "normal").setFontSize(9);
  const consentText =
    "I, the undersigned patient, have been informed about the proposed treatment plan, " +
    "including its purpose, procedures, and possible outcomes. I voluntarily agree to undergo the recommended treatment " +
    "with my full understanding and willingness.";
  const wrappedConsent = doc.splitTextToSize(consentText, 180);
  doc.text(wrappedConsent, leftColumnX + 5, agreementStartY + 20);

  const signatureY = agreementStartY + 15 + (wrappedConsent.length * lineHeight) + 13;
  doc.text("Patient Signature: ___________________________", leftColumnX, signatureY);
  doc.text("Date: ___________________________", rightColumnX, signatureY);

  // ========== COMPACT FOOTER ==========
  doc.setDrawColor(6, 21, 97);
  doc.setLineWidth(0.7);
  doc.line(10, footerY, 200, footerY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Thank you for choosing Yanet Special Dental Clinic", 105, footerY + 4, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Contact: 091 199 7804 | 0904455555", 105, footerY + 8, {
    align: "center",
  });
  doc.text("Address: Bole medanealem Addis Ababa, Ethiopia", 105, footerY + 12, {
    align: "center",
  });

  doc.save(`Medical_History_${patientData.firstname}.pdf`);
};

export default function MedicalFindingForm({ params }: MedicalFindingFormProps) {
  const patientId = params.id;
  const [existingMedicalFindings, setExistingMedicalFindings] = useState<MedicalRecordData[]>([]);
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  const [password, setPassword] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordCorrect, setPasswordCorrect] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const router = useRouter();

  // Fetch patient data using the correct endpoint
  useEffect(() => {
    async function fetchPatientData() {
      try {
        const response = await fetch(`/api/patient/registerdata/${patientId}`);
        if (response.ok) {
          const patientData = await response.json();
          setPatient(patientData);
        } else {
          console.error("Failed to fetch patient data");
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      }
    }

    fetchPatientData();
  }, [patientId]);

  // Fetch medical findings
  useEffect(() => {
    async function fetchMedicalFindings() {
      try {
        const response = await fetch(`/api/patient/MedicalHistory/${patientId}`);
        if (response.ok) {
          const result = await response.json();
          console.log("Fetched medical findings:", result);
          
          if (result.success) {
            setExistingMedicalFindings(result.medicalFindings || []);
          } else {
            console.error("API request was not successful:", result.error);
          }
        } else {
          console.error("Failed to fetch medical findings");
        }
      } catch (error) {
        console.error("Error fetching medical findings:", error);
      }
    }

    fetchMedicalFindings();
  }, [patientId]);

  useEffect(() => {
    if (patient?.Locked) {
      setPasswordModalOpen(true);
    }
  }, [patient]);

  const handleVerifyPassword = async () => {
    setVerifying(true);
    setPasswordError('');
    try {
      const response = await axios.post('/api/locked', { password });
      if (response.data.success) {
        setPasswordCorrect(true);
        setPasswordModalOpen(false);
      } else {
        setPasswordError('Incorrect password');
      }
    } catch (error) {
      setPasswordError('Error verifying password');
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medical finding? This action cannot be undone."
    );
  
    if (!confirmDelete) {
      return;
    }
  
    const toastId = toast.loading("Deleting record...");
  
    try {
      const response = await axios.delete(`/api/patient/MedicalHistory/detail/${recordId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.data.success) {
        setExistingMedicalFindings((prevFindings) =>
          prevFindings.filter((finding) => finding._id !== recordId)
        );
        toast.update(toastId, {
          render: "Dental Record deleted successfully!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: "Failed to delete the record.",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        console.error("Failed to delete the record:", response.data.error);
      }
    } catch (err) {
      toast.update(toastId, {
        render: "Error deleting record.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
      console.error("Error deleting record:", err);
    }
  };

  const handleGenerateMedicalHistoryPDF = (finding: MedicalRecordData) => {
    if (!patient) {
      toast.error("Patient data not available");
      return;
    }
    generateMedicalHistoryPDF([finding], patient);
  };

  const formatChiefComplaintForDisplay = (complaint: MedicalRecordData['ChiefComplaint']) => {
    if (!complaint) return "None";
    
    const selectedComplaints = Object.entries(complaint)
      .filter(([key, value]) => value === true && key !== 'other')
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    
    if (complaint.other) {
      selectedComplaints.push(`Other: ${complaint.other}`);
    }
    
    return selectedComplaints.join(", ") || "None";
  };

  const formatDentalHistoryForDisplay = (history: MedicalRecordData['DentalHistory']) => {
    if (!history) return "None";
    
    const selectedHistory = Object.entries(history)
      .filter(([key, value]) => value === true && key !== 'other')
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());
    
    if (history.other) {
      selectedHistory.push(`Other: ${history.other}`);
    }
    
    return selectedHistory.join(", ") || "None";
  };

 const renderTreatment = (
  treatmentPlan: TreatmentCategory[] | null,
  treatmentDone: TreatmentCategory[] | null,
  diseases: disease[] | null 
) => {
  const formatTreatment = (treatments: TreatmentCategory[] | null) => {
    if (!treatments || treatments.length === 0) return '<div class="text-gray-500 text-base italic">No Treatment</div>';

    return treatments
      .map((treatment, index) => {
        const generalTreatments: string[] = [];
        const categoryTreatments: { [key: string]: string[] } = {};
        
        // General treatments
        Object.entries(treatment).forEach(([key, value]) => {
          if (value === true && !['ToothNumber', 'Surface', 'Quadrant', 'Note'].includes(key)) {
            generalTreatments.push(`<span class="font-semibold">${key.replace(/([A-Z])/g, " $1").trim()}</span>`);
          }
        });
        
        // Nested category treatments
        const categories = ['Restorative', 'Endodontic', 'ImplantMaxillofacial', 'CosmeticAesthetic', 'Prosthodontic', 'Orthodontic'];
        categories.forEach(category => {
          const categoryData = treatment[category as keyof TreatmentCategory];
          if (categoryData && typeof categoryData === 'object') {
            categoryTreatments[category] = [];
            
            Object.entries(categoryData).forEach(([key, value]) => {
              if (value === true && key !== 'other') {
                categoryTreatments[category].push(`<span class="font-medium">${key.replace(/([A-Z])/g, " $1").trim()}</span>`);
              }
            });
            
            if ('other' in categoryData && categoryData.other) {
              categoryTreatments[category].push(`<span class="font-medium">Other - ${categoryData.other}</span>`);
            }
          }
        });

        const toothNumberInfo = treatment.ToothNumber
          ? `<div class="ml-4 mt-1"><span class="font-semibold text-blue-700">Tooth Number:</span> ${treatment.ToothNumber}</div>`
          : "";
        
        const surfaceInfo = treatment.Surface
          ? `<div class="ml-4 mt-1"><span class="font-semibold text-blue-700">Surface:</span> ${treatment.Surface}</div>`
          : "";
        
        const quadrantInfo = treatment.Quadrant
          ? `<div class="ml-4 mt-1"><span class="font-semibold text-blue-700">Quadrant:</span> ${treatment.Quadrant}</div>`
          : "";
        
        const noteInfo = treatment.Note
          ? `<div class="ml-4 mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded"><span class="font-semibold text-yellow-700">Note:</span> ${treatment.Note}</div>`
          : "";

        let treatmentContent = '';
        
        // Add General Treatments if any
        if (generalTreatments.length > 0) {
          treatmentContent += `
            <div class="mb-2">
              <span class="font-bold text-lg text-blue-800 bg-blue-100 px-2 py-1 rounded">General:</span>
              <span class="ml-2 text-base">${generalTreatments.join(", ")}</span>
            </div>
          `;
        }

        // Add Category Treatments
        Object.entries(categoryTreatments).forEach(([category, treatments]) => {
          if (treatments.length > 0) {
            const categoryColors: { [key: string]: { bg: string, text: string } } = {
              'Restorative': { bg: 'bg-green-100', text: 'text-green-800' },
              'Endodontic': { bg: 'bg-purple-100', text: 'text-purple-800' },
              'ImplantMaxillofacial': { bg: 'bg-orange-100', text: 'text-orange-800' },
              'CosmeticAesthetic': { bg: 'bg-pink-100', text: 'text-pink-800' },
              'Prosthodontic': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
              'Orthodontic': { bg: 'bg-teal-100', text: 'text-teal-800' }
            };
            
            const colors = categoryColors[category] || { bg: 'bg-gray-100', text: 'text-gray-800' };
            const categoryName = category.replace(/([A-Z])/g, " $1").trim();
            
            treatmentContent += `
              <div class="mb-2">
                <span class="font-bold text-lg ${colors.text} ${colors.bg} px-2 py-1 rounded">${categoryName}:</span>
                <span class="ml-2 text-base">${treatments.join(", ")}</span>
              </div>
            `;
          }
        });

        return `
          <div class="mb-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm">
            <div class="flex items-start mb-2">
              <span class="font-bold text-lg bg-blue-500 text-white px-3 py-1 rounded-full mr-3 min-w-8 text-center">${index + 1}</span>
              <div class="flex-1">
                ${treatmentContent}
                ${toothNumberInfo}
                ${surfaceInfo}
                ${quadrantInfo}
                ${noteInfo}
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  };

  const formatDiseases = (diseases: disease[] | null) => {
    if (!diseases || diseases.length === 0) return '<div class="text-gray-500 text-base italic">No diseases listed</div>';
  
    return diseases
      .map((disease, index) => `
        <div class="flex items-center mb-2 p-2 bg-red-50 rounded border-l-4 border-red-400">
          <span class="font-bold text-red-700 bg-white px-2 py-1 rounded-full mr-3 min-w-6 text-center text-sm">${index + 1}</span>
          <span class="text-base font-medium text-gray-800">${disease}</span>
        </div>
      `)
      .join("");
  };

  const plan = formatTreatment(treatmentPlan);
  const done = formatTreatment(treatmentDone);
  const diseaseList = formatDiseases(diseases);

  return `
    <div class="space-y-4 mt-2">
      <!-- Diseases Section -->
      <div class="bg-gradient-to-br from-red-50 to-white rounded-xl p-2 border border-red-200 shadow-sm">
        <h3 class="text-lg font-bold text-red-800 border-l-4 border-red-500 pl-2 mb-2 flex items-center">
          <span class="bg-red-500 text-white p-1 rounded mr-2">🩺</span>
          Diseases
        </h3>
        <div class="space-y-2">
          ${diseaseList}
        </div>
      </div>

      <!-- Treatment Plan Section -->
      <div class="bg-gradient-to-br from-blue-50 to-white rounded-xl p-2 border border-blue-200 shadow-sm">
        <h3 class="text-lg font-bold text-blue-800 border-l-4 border-blue-500 pl-2 mb-2 flex items-center">
          <span class="bg-blue-500 text-white p-1 rounded mr-2">📋</span>
          Treatment Plan
        </h3>
        <div class="space-y-3">
          ${plan}
        </div>
      </div>

      <!-- Treatment Done Section -->
      <div class="bg-gradient-to-br from-green-50 to-white rounded-xl p-2 border border-green-200 shadow-sm">
        <h3 class="text-lg font-bold text-green-800 border-l-4 border-green-500 pl-2 mb-2 flex items-center">
          <span class="bg-green-500 text-white p-1 rounded mr-2">✅</span>
          Treatment Done
        </h3>
        <div class="space-y-3">
          ${done}
        </div>
      </div>
    </div>
  `;
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
  
  const handleEdit = (patientId: string, findingId: string) => {
    if (role === "doctor") {
      router.push(`/doctor/medicaldata/medicalhistory/edit?findingId=${findingId}&patientId=${patientId}`);
    } else if (role === "admin") {
      router.push(`/admin/medicaldata/medicalhistory/edit?findingId=${findingId}&patientId=${patientId}`);
    }
  };

  if (patient?.Locked && !passwordCorrect) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          p: 3,
          bgcolor: 'black',
        }}
      >
        <Paper
          elevation={3}
          sx={{ 
            p: 4, 
            maxWidth: 700,
            width: '100%',
            textAlign: 'center', 
            backgroundColor: '#1e1e1e', 
            color: 'white',
            borderRadius: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Patient Record Locked
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
            This patient record is currently locked. Please contact an administrator for access.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setPasswordModalOpen(true)}
            sx={{ mt: 2, px: 3, py: 1 }}
          >
            Unlock with Password
          </Button>
        </Paper>
    
        <Dialog
          open={passwordModalOpen}
          onClose={(_, reason) => {
            if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
              setPasswordModalOpen(false);
            }
          }}
          disableEscapeKeyDown
          sx={{
            "& .MuiDialog-container": {
              backdropFilter: "blur(5px)",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
            },
          }}
          PaperProps={{
            sx: {
              width: "100%",
              maxWidth: "500px",
              backgroundColor: "#1e1e1e",
              color: "white",
              borderRadius: "8px",
            },
          }}
        >
          <DialogTitle sx={{ color: "white" }}>Enter Password</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: "white" }}>
              This patient record is locked. Please enter the password to continue.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              sx={{
                "& .MuiInputBase-root": {
                  color: "white",
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "gray.600",
                  },
                  "&:hover fieldset": {
                    borderColor: "gray.500",
                  },
                },
                "& .MuiFormLabel-root": {
                  color: "gray.400",
                },
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleVerifyPassword}
              disabled={verifying || !password}
              startIcon={verifying ? <CircularProgress size={20} /> : null}
              sx={{
                color: "white",
                backgroundColor: "#3f51b5",
                "&:hover": {
                  backgroundColor: "#303f9f",
                },
              }}
            >
              Verify
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

 return (
  <div className="flex flex-col lg:flex-row mx-2 sm:mx-4 lg:m-7">
    <div className="flex-grow lg:ml-60 container mx-auto p-2 sm:p-4">
      <div className="flex flex-col lg:flex-row lg:space-x-8 space-y-4 lg:space-y-0">
        {/* Patient Component - Full width on mobile, 1/3 on desktop */}
        <div className="w-full lg:w-1/3 p-2 sm:p-4">
          <PatientComponent params={params} />
        </div>
        
        {/* Main Content - Full width on mobile, 2/3 on desktop */}
        <div className="w-full lg:w-2/3 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-2xl font-bold">Dental Record</h1>
            {(role === "admin" || role === "doctor") && (
              <Link
                href={`/${role}/medicaldata/medicalhistory/add/${patientId}`}
                className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-600 text-sm sm:text-base w-full sm:w-auto text-center"
              >
                New Record +
              </Link>
            )}
          </div>

          {existingMedicalFindings.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No Dental findings available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {existingMedicalFindings.map((finding) => (
                <div
                  key={finding._id}
                  className="border p-3 sm:p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  {/* Metadata Section */}
                  <div className="flex flex-col space-y-1 w-full sm:w-auto">
                                        <div className="text-gray-600 text-sm font-normal">

                                         Branch: {finding.branch?.branchName || "Unknown"}
  </div>
                    <div className="text-gray-600 text-sm font-bold">
                      {finding.createdBy?.username || "Unknown"}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {new Date(finding.createdAt || "").toLocaleString()}
                    </div>
                    <div className="text-gray-600 text-sm">
                      {renderUpdates(finding.changeHistory)}
                    </div>
                  </div>
                  
                  {/* Content Section */}
                  <div className="flex-grow px-0 sm:px-2 w-full">
                    {finding.Recommendation && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Recommendation</h3>
                        <p className="text-sm sm:text-base">
                          {finding.Recommendation.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.ChiefComplaint && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Chief Complaint</h3>
                        <p className="text-sm sm:text-base">
                          {formatChiefComplaintForDisplay(finding.ChiefComplaint)}
                        </p>
                      </div>
                    )}
                    
                    {finding.PhysicalExamination && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Physical Examination</h3>
                        <p className="text-sm sm:text-base">
                          {finding.PhysicalExamination.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.HistoryPresent && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">History Present</h3>
                        <p className="text-sm sm:text-base">
                          {finding.HistoryPresent.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.PresentCondition && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Present Condition</h3>
                        <p className="text-sm sm:text-base">
                          {finding.PresentCondition.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.DrugAllergy && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Drug Allergy</h3>
                        <p className="text-sm sm:text-base">
                          {finding.DrugAllergy.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.Diagnosis && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Diagnosis</h3>
                        <p className="text-sm sm:text-base">
                          {finding.Diagnosis.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.DentalHistory && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Dental History</h3>
                        <p className="text-sm sm:text-base">
                          {formatDentalHistoryForDisplay(finding.DentalHistory)}
                        </p>
                      </div>
                    )}
                    
                    {finding.IntraoralExamination && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Intraoral Examination</h3>
                        <p className="text-sm sm:text-base">
                          {finding.IntraoralExamination.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.ExtraoralExamination && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Extraoral Examination</h3>
                        <p className="text-sm sm:text-base">
                          {finding.ExtraoralExamination.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.Investigation && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Investigation</h3>
                        <p className="text-sm sm:text-base">
                          {finding.Investigation.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    {finding.Assessment && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Assessment</h3>
                        <p className="text-sm sm:text-base">
                          {finding.Assessment.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                    
                    <div
                      dangerouslySetInnerHTML={{
                        __html: renderTreatment(finding.TreatmentPlan, finding.TreatmentDone, finding.diseases),
                      }}
                    />
                    
                    {finding.NextProcedure && (
                      <div className="bg-white shadow-sm rounded-md mb-3">
                        <h3 className="text-sm sm:text-base text-gray-800 border-l-4 font-bold border-blue-500 pl-2 mt-2 mb-1">Next Procedure</h3>
                        <p className="text-sm sm:text-base">
                          {finding.NextProcedure.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-row sm:flex-col space-x-2 sm:space-x-0 sm:space-y-2 justify-end w-full sm:w-auto">
                    {(role === "doctor" || role === "admin") && (
                      <>
                        <button
                          className="hover:bg-blue-300 p-2 rounded-full"
                          onClick={() => handleEdit(patientId, finding._id)}
                          aria-label="Edit"
                        >
                          <EditOutlined className="text-lg sm:text-xl text-blue-500" />
                        </button>
                        <button
                          className="hover:bg-green-300 p-2 rounded-full"
                          onClick={() => handleGenerateMedicalHistoryPDF(finding)}
                          aria-label="Generate PDF"
                          title="Generate PDF"
                        >
                          <FilePdfOutlined className="text-lg sm:text-xl text-green-500" />
                        </button>
                        <button
                          className="hover:bg-red-300 p-2 rounded-full"
                          onClick={() => handleDelete(finding._id)}
                          aria-label="Delete"
                        >
                          <DeleteOutlined className="text-lg sm:text-xl text-red-500" />
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
      <ToastContainer />
    </div>
  </div>
);
}