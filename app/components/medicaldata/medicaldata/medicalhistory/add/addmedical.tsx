"use client";

import React, { useState, useMemo, useEffect } from "react";
import PatientComponent from "@/app/components/patient/PatientComponent";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DeleteOutlined } from "@ant-design/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import axios from "axios";
import CollapsibleSection from "../CollapsibleSection";

type MedicalFindingFormProps = {
  params: {
    id: string;
  };
};

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

type diseaseInfo = {
  id: string;
  _id: string;
  disease: string;
};

type FormData = {
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
  TreatmentPlan: TreatmentCategory[];
  TreatmentDone: TreatmentCategory[];
  diseases: string[];
};

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
  Hypotension: string;
  Tuberculosis: string;
  Astema: string;
  Diabetics: string;
  Hepatitis: string;
  BleedingTendency: string;
  Epilepsy: string;
  description: string;
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

const InputField = ({
  label,
  id,
  name,
  value,
  onChange,
  isTextArea = false,
  error = "",
}: {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isTextArea?: boolean;
  rows?: number;
  error?: string;
}) => (
  <div className="mt-4">
    <label htmlFor={id} className="block font-bold mb-2">
      {label}
    </label>
    {isTextArea ? (
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border p-2 rounded-md w-full ${error ? "border-red-500" : ""}`}
        rows={Math.max(3, Math.ceil(value.length / 100))}
      />
    ) : (
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border p-2 rounded-md w-full ${error ? "border-red-500" : ""}`}
      />
    )}
    {error && <p className="text-red-500">{error}</p>}
  </div>
);

const CheckboxField = ({
  label,
  name,
  checked,
  onChange,
}: {
  label: string;
  name: string;
  checked?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="flex items-center mb-2">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="mr-2"
    />
    <label>{label}</label>
  </div>
);

export default function MedicalFindingForm({ params }: MedicalFindingFormProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
    
  const [showAll, setShowAll] = useState(false);

  const toggleShow = () => {
    setShowAll(!showAll);
  };

  const [formData, setFormData] = useState<FormData>({
    Recommendation: "",
    ChiefComplaint: {},
    DentalHistory: {},
    PhysicalExamination: "",
    HistoryPresent: "",
    PresentCondition: "",
    DrugAllergy: "",
    Diagnosis: "",
    IntraoralExamination: "",
    ExtraoralExamination: "",
    Investigation: "",
    Assessment: "",
    NextProcedure: "",
    TreatmentPlan: [],
    TreatmentDone: [],
    diseases: [],
  });
  
  const [existingMedicalFindings, setExistingMedicalFindings] = useState<MedicalRecordData[]>([]);
  const [diseases, setDiseases] = useState<diseaseInfo[]>([]);

  useEffect(() => {
    async function fetchMedicalFindings() {
      try {
        const response = await fetch(`/api/patient/healthInfo/${patientId}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        if (result.success) {
          console.log(result.data)
          setExistingMedicalFindings(result.data);
        } else {
          console.error("No data found:", result.message);
        }
      } catch (error) {
        console.error("Error fetching medical findings:", error);
      }
    }
    fetchMedicalFindings();
  }, [patientId]);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const response = await axios.get("/api/Disease/findall");
        console.log("Disease Data:", response.data);
        if (response.status === 200) {
          setDiseases(response.data.data);
        } else {
          console.error("Error fetching Disease:", response.statusText);
        }
      } catch (err) {
        console.error("Error fetching Disease:", err);
      }
    };
    fetchDiseases();
  }, []);

  const handleAddEntry = (field: "TreatmentPlan" | "TreatmentDone") => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: [
        ...(prevData[field] || []),
        {}, // Empty treatment category object
      ],
    }));
  };

  const handleRemoveEntry = (index: number, field: "TreatmentPlan" | "TreatmentDone") => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: prevData[field].filter((_, i) => i !== index),
    }));
  };

 const handleDynamicInputChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  index: number,
  field: "TreatmentPlan" | "TreatmentDone",
  category?: string,
  subField?: string
) => {
  const { name, value } = e.target;

  setFormData((prevData) => {
    if (category && subField) {
      // Handle nested fields (e.g., Restorative.other)
      return {
        ...prevData,
        [field]: prevData[field].map((entry, i) => {
          if (i !== index) return entry;

          const currentCategory = entry[category as keyof TreatmentCategory];
          
          // Ensure the category exists and is an object
          if (currentCategory && typeof currentCategory === 'object' && !Array.isArray(currentCategory)) {
            return {
              ...entry,
              [category]: {
                ...currentCategory,
                [subField]: value
              }
            };
          } else {
            // If category doesn't exist or isn't an object, create it
            return {
              ...entry,
              [category]: {
                [subField]: value
              }
            };
          }
        }),
      };
    } else {
      // Handle top-level fields
      return {
        ...prevData,
        [field]: prevData[field].map((entry, i) =>
          i === index ? { ...entry, [name]: value } : entry
        ),
      };
    }
  });
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/patient/MedicalHistory/${patientId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        console.log("Form submitted successfully");
        if (role === "doctor") {
          router.push(`/doctor/medicaldata/medicalhistory/all/${patientId}`);
        } else if (role === "admin") {
          router.push(`/admin/medicaldata/medicalhistory/all/${patientId}`);
        }
      } else {
        console.error("Failed to submit form");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    console.log("Checkbox clicked:", name, checked);
    setFormData((prevData) => {
      const updatedDiseases = checked
        ? [...prevData.diseases, name]
        : prevData.diseases.filter((id) => id !== name);
   
      return { ...prevData, diseases: updatedDiseases };
    });
  };

  const handleChiefComplaintChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      ChiefComplaint: {
        ...prevData.ChiefComplaint,
        [name]: checked,
      },
    }));
  };

  const handleDentalHistoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      DentalHistory: {
        ...prevData.DentalHistory,
        [name]: checked,
      },
    }));
  };

  const handleTreatmentCheckboxChange = (
  e: React.ChangeEvent<HTMLInputElement>,
  key: string,
  index: number,
  field: "TreatmentPlan" | "TreatmentDone",
  category?: string,
  subField?: string
) => {
  const { checked } = e.target;

  setFormData((prevData) => {
    if (category && subField) {
      // Handle nested checkboxes (e.g., Restorative.AmalgamFilling)
      return {
        ...prevData,
        [field]: prevData[field].map((entry, i) => {
          if (i !== index) return entry;

          const currentCategory = entry[category as keyof TreatmentCategory] as Record<string, any>;
          
          return {
            ...entry,
            [category]: {
              ...(currentCategory || {}),
              [subField]: checked
            }
          };
        }),
      };
    } else {
      // Handle top-level checkboxes (e.g., Extraction)
      return {
        ...prevData,
        [field]: prevData[field].map((entry, i) =>
          i === index ? { ...entry, [key]: checked } : entry
        ),
      };
    }
  });
};

  // Treatment categories for organized display
 const treatmentCategories = [
  {
    title: "General Treatments",
    fields: [
      { key: "Extraction", label: "Extraction" },
      { key: "Scaling", label: "Scaling" },
      { key: "Rootcanal", label: "Root Canal" },
      { key: "Filling", label: "Filling" },
      { key: "Bridge", label: "Bridge" },
      { key: "Crown", label: "Crown" },
      { key: "Apecectomy", label: "Apecectomy" },
      { key: "Fixedorthodonticappliance", label: "Fixed Orthodontic Appliance" },
      { key: "Removableorthodonticappliance", label: "Removable Orthodontic Appliance" },
      { key: "Removabledenture", label: "Removable Denture" },
      { key: "Splinting", label: "Splinting" },
    ]
  },
  {
    title: "Restorative Dentistry",
    category: "Restorative",
    fields: [
      { key: "AmalgamFilling", label: "Amalgam Filling" },
      { key: "CompositeFilling", label: "Composite Filling" },
      { key: "GlassIonomer", label: "Glass Ionomer" },
      { key: "TemporaryFilling", label: "Temporary Filling" },
      { key: "CrownPreparation", label: "Crown Preparation" },
      { key: "CrownCementation", label: "Crown Cementation" },
      { key: "VeneerPlacement", label: "Veneer Placement" },
      { key: "CoreBuildUp", label: "Core Build Up" },
      { key: "OnlayInlay", label: "Onlay/Inlay" },
      { key: "ToothRecontouring", label: "Tooth Recontouring" },
    ]
  },
  {
    title: "Endodontics",
    category: "Endodontic",
    fields: [
      { key: "RootCanalTreatment", label: "Root Canal Treatment" },
      { key: "ReRootCanalTreatment", label: "Re-Root Canal Treatment" },
      { key: "PulpCappingDirect", label: "Pulp Capping Direct" },
      { key: "PulpCappingIndirect", label: "Pulp Capping Indirect" },
      { key: "Pulpectomy", label: "Pulpectomy" },
      { key: "Pulpotomy", label: "Pulpotomy" },
      { key: "Apexification", label: "Apexification" },
      { key: "Apicoectomy", label: "Apicoectomy" },
      { key: "RootCanalPost", label: "Root Canal Post" },
    ]
  },
  {
    title: "Implant / Maxillofacial",
    category: "ImplantMaxillofacial",
    fields: [
      { key: "ImplantPlacement", label: "Implant Placement" },
      { key: "BoneGraft", label: "Bone Graft" },
      { key: "RidgeAugmentation", label: "Ridge Augmentation" },
      { key: "SinusLift", label: "Sinus Lift" },
      { key: "SoftTissueGraft", label: "Soft Tissue Graft" },
      { key: "ImplantExposure", label: "Implant Exposure" },
      { key: "ImplantCrownDelivery", label: "Implant Crown Delivery" },
      { key: "MaxillofacialFractureRepair", label: "Maxillofacial Fracture Repair" },
      { key: "TMJDisorderManagement", label: "TMJ Disorder Management" },
    ]
  },
  {
    title: "Cosmetic / Aesthetic Dentistry",
    category: "CosmeticAesthetic",
    fields: [
      { key: "TeethWhiteningOffice", label: "Teeth Whitening Office" },
      { key: "TeethWhiteningHomeKit", label: "Teeth Whitening Home Kit" },
      { key: "CompositeBonding", label: "Composite Bonding" },
      { key: "DiastemaClosure", label: "Diastema Closure" },
      { key: "VeneerPorcelain", label: "Veneer Porcelain" },
      { key: "SmileMakeover", label: "Smile Makeover" },
      { key: "GumContouring", label: "Gum Contouring" },
      { key: "GingivalDepigmentation", label: "Gingival Depigmentation" },
      { key: "EnamelMicroabrasion", label: "Enamel Microabrasion" },
      { key: "ToothJewelry", label: "Tooth Jewelry" },
    ]
  },
  {
    title: "Prosthodontics",
    category: "Prosthodontic",
    fields: [
      { key: "CompleteDenture", label: "Complete Denture" },
      { key: "PartialDenture", label: "Partial Denture" },
      { key: "FlexibleDenture", label: "Flexible Denture" },
      { key: "ImplantSupportedOverdenture", label: "Implant Supported Overdenture" },
      { key: "FixedPartialDenture", label: "Fixed Partial Denture" },
      { key: "CrownAndBridgeMaintenance", label: "Crown And Bridge Maintenance" },
      { key: "ReliningRebasing", label: "Relining Rebasing" },
      { key: "DentureRepair", label: "Denture Repair" },
      { key: "OcclusalAdjustment", label: "Occlusal Adjustment" },
      { key: "NightGuardFabrication", label: "Night Guard Fabrication" },
    ]
  },
  {
    title: "Orthodontics",
    category: "Orthodontic",
    fields: [
      { key: "FixedAppliance", label: "Fixed Appliance" },
      { key: "RemovableAppliance", label: "Removable Appliance" },
      { key: "RetainerPlacement", label: "Retainer Placement" },
      { key: "BracketBonding", label: "Bracket Bonding" },
      { key: "WireChange", label: "Wire Change" },
      { key: "Debonding", label: "Debonding" },
      { key: "SpaceMaintainer", label: "Space Maintainer" },
      { key: "InterceptiveTreatment", label: "Interceptive Treatment" },
    ]
  }
];

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Dental Findings</h1>

           

         

            <form onSubmit={handleSubmit}>
              <InputField
                label="Recommendation"
                id="Recommendation"
                name="Recommendation"
                value={formData.Recommendation}
                onChange={handleInputChange}
                isTextArea={false}
              />

              {/* Chief Complaint Section */}
              <div className="mt-4">
                <h2 className="font-bold mb-2">Chief Complaint</h2>
                <div className="grid grid-cols-2 gap-2">
                  <CheckboxField
                    label="None"
                    name="None"
                    checked={formData.ChiefComplaint.None || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Improve My Smile"
                    name="ImproveMySmile"
                    checked={formData.ChiefComplaint.ImproveMySmile || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Crooked Teeth"
                    name="CrookedTeeth"
                    checked={formData.ChiefComplaint.CrookedTeeth || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Crowding"
                    name="Crowding"
                    checked={formData.ChiefComplaint.Crowding || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Spacing"
                    name="Spacing"
                    checked={formData.ChiefComplaint.Spacing || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Crown"
                    name="Crown"
                    checked={formData.ChiefComplaint.Crown || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Overbite"
                    name="Overbite"
                    checked={formData.ChiefComplaint.Overbite || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Underbite"
                    name="Underbite"
                    checked={formData.ChiefComplaint.Underbite || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Deepbite"
                    name="Deepbite"
                    checked={formData.ChiefComplaint.Deepbite || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Crossbite"
                    name="Crossbite"
                    checked={formData.ChiefComplaint.Crossbite || false}
                    onChange={handleChiefComplaintChange}
                  />
                  <CheckboxField
                    label="Impacted Teeth"
                    name="ImpactedTeeth"
                    checked={formData.ChiefComplaint.ImpactedTeeth || false}
                    onChange={handleChiefComplaintChange}
                  />
                </div>
                <InputField
                  label="Other Chief Complaint"
                  id="ChiefComplaintOther"
                  name="other"
                  value={formData.ChiefComplaint.other || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ChiefComplaint: { ...prev.ChiefComplaint, other: e.target.value }
                  }))}
                  isTextArea={false}
                />
              </div>

              {/* Dental History Section */}
              <div className="mt-4">
                <h2 className="font-bold mb-2">Dental History</h2>
                <div className="grid grid-cols-2 gap-2">
                  <CheckboxField
                    label="None"
                    name="None"
                    checked={formData.DentalHistory.None || false}
                    onChange={handleDentalHistoryChange}
                  />
                  <CheckboxField
                    label="Previous Orthodontic Treatment"
                    name="PreviousOrthodonticTreatment"
                    checked={formData.DentalHistory.PreviousOrthodonticTreatment || false}
                    onChange={handleDentalHistoryChange}
                  />
                  <CheckboxField
                    label="Missing Tooth"
                    name="MissingTooth"
                    checked={formData.DentalHistory.MissingTooth || false}
                    onChange={handleDentalHistoryChange}
                  />
                  <CheckboxField
                    label="Under Sized Tooth"
                    name="UnderSizedTooth"
                    checked={formData.DentalHistory.UnderSizedTooth || false}
                    onChange={handleDentalHistoryChange}
                  />
                  <CheckboxField
                    label="Attrition"
                    name="Attrition"
                    checked={formData.DentalHistory.Attrition || false}
                    onChange={handleDentalHistoryChange}
                  />
                  <CheckboxField
                    label="Impacted Tooth"
                    name="ImpactedTooth"
                    checked={formData.DentalHistory.ImpactedTooth || false}
                    onChange={handleDentalHistoryChange}
                  />
                </div>
                <InputField
                  label="Other Dental History"
                  id="DentalHistoryOther"
                  name="other"
                  value={formData.DentalHistory.other || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    DentalHistory: { ...prev.DentalHistory, other: e.target.value }
                  }))}
                  isTextArea={false}
                />
              </div>

              <InputField
                label="Physical Examination"
                id="PhysicalExamination"
                name="PhysicalExamination"
                value={formData.PhysicalExamination}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="History Present"
                id="HistoryPresent"
                name="HistoryPresent"
                value={formData.HistoryPresent}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="Present Condition"
                id="PresentCondition"
                name="PresentCondition"
                value={formData.PresentCondition}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="Drug Allergy"
                id="DrugAllergy"
                name="DrugAllergy"
                value={formData.DrugAllergy}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="Diagnosis"
                id="Diagnosis"
                name="Diagnosis"
                value={formData.Diagnosis}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              {/* Past Medical History Section */}
              <label className="block font-bold mt-2 mb-2">Past Medical History</label>
              <div>
                <CollapsibleSection>
                  {existingMedicalFindings.length === 0 ? (
                    <p className="text-gray-500">No medical findings available.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {existingMedicalFindings.map((finding) => (
                        <div key={finding._id} className="border p-4 flex items-start justify-between">
                          <div className="flex-grow px-4">
                            {finding.userinfo && finding.userinfo.length > 0 && (
                              <div className="grid grid-cols-2 gap-1 mt-2">
                                {Object.entries(finding.userinfo[0])
                                  .filter(([key, value]) => key !== "_id" && key !== "IfanyotherDiseases" && value)
                                  .map(([key,]) => (
                                    <div key={key} className="p-1 rounded-lg">
                                      <p className="font-bold">
                                        {key === "Tuberculosis" ? "Tuberculosis / Pneumonia" : key.replace(/([A-Z])/g, ' $1').trim()}
                                      </p>
                                      <div className="text-sm text-green-500">True</div>
                                    </div>
                                  ))}
                                {finding.userinfo[0].IfanyotherDiseases && (
                                  <div className="p-3 rounded-lg">
                                    <p className="font-bold">If any other diseases:</p>
                                    <div className="text-sm">{finding.userinfo[0].IfanyotherDiseases}</div>
                                  </div>
                                )}
                              </div>
                            )}

                            {showAll && (
                              <>
                                {finding.bloodgroup && <p>Blood Group: {finding.bloodgroup}</p>}
                                {finding.weight && <p>Weight: {finding.weight}</p>}
                                {finding.height && <p>Height: {finding.height}</p>}
                                {finding.Medication && <p>Medication: {finding.Medication}</p>}
                                {finding.allergies && <p>Allergies: {finding.allergies}</p>}
                                {finding.habits && <p>Habits: {finding.habits}</p>}

                                {finding.Blood_Pressure && (
                                  <>
                                    <p><strong>Vital Signs:</strong></p>
                                    <ul className="list-disc ml-4">
                                      {finding.Core_Temperature && <li>Core Temperature: {finding.Core_Temperature}</li>}
                                      {finding.Respiratory_Rate && <li>Respiratory Rate: {finding.Respiratory_Rate}</li>}
                                      {finding.Blood_Oxygen && <li>Blood Oxygen: {finding.Blood_Oxygen}</li>}
                                      {finding.Blood_Pressure && <li>Blood Pressure: {finding.Blood_Pressure}</li>}
                                      {finding.heart_Rate && <li>Heart Rate: {finding.heart_Rate}</li>}
                                    </ul>
                                  </>
                                )}

                                {finding.Hypotension && <p>Hypotension: {finding.Hypotension}</p>}
                                {finding.Tuberculosis && <p>Tuberculosis or Pneumonia: {finding.Tuberculosis}</p>}
                                {finding.Astema && <p>Astema: {finding.Astema}</p>}
                                {finding.Hepatitis && <p>Hepatitis: {finding.Hepatitis}</p>}
                                {finding.Diabetics && <p>Diabetics: {finding.Diabetics}</p>}
                                {finding.BleedingTendency && <p>Bleeding Tendency: {finding.BleedingTendency}</p>}
                                {finding.Epilepsy && <p>Epilepsy: {finding.Epilepsy}</p>}
                                {finding.description && <p>Description: {finding.description}</p>}
                                {finding.createdAt && <p>Created at: {new Date(finding.createdAt || "").toLocaleString()}</p>}
                                {finding.updatedAt && <p>Updated at: {new Date(finding.updatedAt || "").toLocaleString()} </p>}
                              </>
                            )}

                            <button
                              type="button"
                              onClick={toggleShow}
                              className="mt-4 text-blue-500"
                            >
                              {showAll ? "Hide Details" : "Show Details"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleSection>
              </div>

              <InputField
                label="Intraoral Examination"
                id="IntraoralExamination"
                name="IntraoralExamination"
                value={formData.IntraoralExamination}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="Extraoral Examination"
                id="ExtraoralExamination"
                name="ExtraoralExamination"
                value={formData.ExtraoralExamination}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="Investigation"
                id="Investigation"
                name="Investigation"
                value={formData.Investigation}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <InputField
                label="Assessment"
                id="Assessment"
                name="Assessment"
                value={formData.Assessment}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              {/* Diseases Checkboxes */}
              <div className="mt-4">
                <h2 className="font-bold mb-2">Diseases</h2>
                {diseases.map((disease) => (
                  <CheckboxField
                    key={disease._id}
                    label={disease.disease}
                    name={disease._id}
                    checked={formData.diseases.includes(disease._id)}
                    onChange={handleCheckbox}
                  />
                ))}
              </div>

             {/* Dynamic TreatmentPlan */}
<div className="mt-4">
  <h2 className="font-bold mb-2">Treatment Plan</h2>
  {formData.TreatmentPlan.map((plan, index) => (
    <div key={index} className="mb-4 border p-4 rounded-md shadow-sm">
      <h3 className="font-semibold mb-2">Treatment Plan Entry {index + 1}</h3>
      
      {/* Treatment Categories Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-4 overflow-x-auto">
          <TabsTrigger value="general" className="text-xs md:text-sm px-2 py-1">General</TabsTrigger>
          <TabsTrigger value="restorative" className="text-xs md:text-sm px-2 py-1">Restorative</TabsTrigger>
          <TabsTrigger value="endodontic" className="text-xs md:text-sm px-2 py-1">Endodontic</TabsTrigger>
          <TabsTrigger value="implant" className="text-xs md:text-sm px-2 py-1">Implant</TabsTrigger>
          <TabsTrigger value="cosmetic" className="text-xs md:text-sm px-2 py-1">Cosmetic</TabsTrigger>
          <TabsTrigger value="prosthodontic" className="text-xs md:text-sm px-2 py-1">Prosthodontic</TabsTrigger>
          <TabsTrigger value="orthodontic" className="text-xs md:text-sm px-2 py-1">Orthodontic</TabsTrigger>
          <TabsTrigger value="details" className="text-xs md:text-sm px-2 py-1">Details</TabsTrigger>
        </TabsList>

        {/* General Treatments Tab */}
        <TabsContent value="general" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[0].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.${field.key}`}
                checked={plan[field.key as keyof TreatmentCategory] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan")}
              />
            ))}
          </div>
        </TabsContent>

        {/* Restorative Dentistry Tab */}
        <TabsContent value="restorative" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[1].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.Restorative.${field.key}`}
                checked={plan.Restorative?.[field.key as keyof typeof plan.Restorative] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan", "Restorative", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Restorative"
              id={`RestorativeOther-${index}`}
              name="other"
              value={plan.Restorative?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan", "Restorative", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Endodontics Tab */}
        <TabsContent value="endodontic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[2].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.Endodontic.${field.key}`}
                checked={plan.Endodontic?.[field.key as keyof typeof plan.Endodontic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan", "Endodontic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Endodontic"
              id={`EndodonticOther-${index}`}
              name="other"
              value={plan.Endodontic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan", "Endodontic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Implant / Maxillofacial Tab */}
        <TabsContent value="implant" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[3].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.ImplantMaxillofacial.${field.key}`}
                checked={plan.ImplantMaxillofacial?.[field.key as keyof typeof plan.ImplantMaxillofacial] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan", "ImplantMaxillofacial", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Implant/Maxillofacial"
              id={`ImplantMaxillofacialOther-${index}`}
              name="other"
              value={plan.ImplantMaxillofacial?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan", "ImplantMaxillofacial", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Cosmetic / Aesthetic Dentistry Tab */}
        <TabsContent value="cosmetic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[4].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.CosmeticAesthetic.${field.key}`}
                checked={plan.CosmeticAesthetic?.[field.key as keyof typeof plan.CosmeticAesthetic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan", "CosmeticAesthetic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Cosmetic/Aesthetic"
              id={`CosmeticAestheticOther-${index}`}
              name="other"
              value={plan.CosmeticAesthetic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan", "CosmeticAesthetic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Prosthodontics Tab */}
        <TabsContent value="prosthodontic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[5].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.Prosthodontic.${field.key}`}
                checked={plan.Prosthodontic?.[field.key as keyof typeof plan.Prosthodontic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan", "Prosthodontic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Prosthodontic"
              id={`ProsthodonticOther-${index}`}
              name="other"
              value={plan.Prosthodontic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan", "Prosthodontic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Orthodontics Tab */}
        <TabsContent value="orthodontic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[6].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentPlan.Orthodontic.${field.key}`}
                checked={plan.Orthodontic?.[field.key as keyof typeof plan.Orthodontic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentPlan", "Orthodontic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Orthodontic"
              id={`OrthodonticOther-${index}`}
              name="other"
              value={plan.Orthodontic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan", "Orthodontic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Tooth Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Tooth Number"
              id={`TreatmentPlan[${index}].ToothNumber`}
              name="ToothNumber"
              value={plan.ToothNumber || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan")}
            />
            <InputField
              label="Surface"
              id={`TreatmentPlan[${index}].Surface`}
              name="Surface"
              value={plan.Surface || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan")}
            />
            <InputField
              label="Quadrant"
              id={`TreatmentPlan[${index}].Quadrant`}
              name="Quadrant"
              value={plan.Quadrant || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan")}
            />
          </div>
          
          <div className="mt-4">
            <InputField
              label="Note"
              id={`TreatmentPlan[${index}].Note`}
              name="Note"
              value={plan.Note || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentPlan")}
              isTextArea={true}
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>

      <button
        type="button"
        className="text-red-500 mt-4 flex items-center gap-1"
        onClick={() => handleRemoveEntry(index, "TreatmentPlan")}
      >
        <DeleteOutlined />
        <span>Remove Entry</span>
      </button>
    </div>
  ))}
  <button
    type="button"
    className="bg-gray-500 text-white px-4 py-2 rounded-md mt-2 w-full sm:w-auto"
    onClick={() => handleAddEntry("TreatmentPlan")}
  >
    + Add Treatment Plan
  </button>
</div>

{/* Dynamic TreatmentDone - Same structure as TreatmentPlan */}
<div className="mt-4">
  <h2 className="font-bold mb-2">Treatment Done</h2>
  {formData.TreatmentDone.map((done, index) => (
    <div key={index} className="mb-4 border p-4 rounded-md shadow-sm">
      <h3 className="font-semibold mb-2">Treatment Done Entry {index + 1}</h3>
      
      {/* Treatment Categories Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-1 mb-4 overflow-x-auto">
          <TabsTrigger value="general" className="text-xs md:text-sm px-2 py-1">General</TabsTrigger>
          <TabsTrigger value="restorative" className="text-xs md:text-sm px-2 py-1">Restorative</TabsTrigger>
          <TabsTrigger value="endodontic" className="text-xs md:text-sm px-2 py-1">Endodontic</TabsTrigger>
          <TabsTrigger value="implant" className="text-xs md:text-sm px-2 py-1">Implant</TabsTrigger>
          <TabsTrigger value="cosmetic" className="text-xs md:text-sm px-2 py-1">Cosmetic</TabsTrigger>
          <TabsTrigger value="prosthodontic" className="text-xs md:text-sm px-2 py-1">Prosthodontic</TabsTrigger>
          <TabsTrigger value="orthodontic" className="text-xs md:text-sm px-2 py-1">Orthodontic</TabsTrigger>
          <TabsTrigger value="details" className="text-xs md:text-sm px-2 py-1">Details</TabsTrigger>
        </TabsList>

        {/* General Treatments Tab */}
        <TabsContent value="general" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[0].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.${field.key}`}
                checked={done[field.key as keyof TreatmentCategory] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone")}
              />
            ))}
          </div>
        </TabsContent>

        {/* Restorative Dentistry Tab */}
        <TabsContent value="restorative" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[1].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.Restorative.${field.key}`}
                checked={done.Restorative?.[field.key as keyof typeof done.Restorative] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone", "Restorative", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Restorative"
              id={`RestorativeOther-${index}`}
              name="other"
              value={done.Restorative?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone", "Restorative", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Endodontics Tab */}
        <TabsContent value="endodontic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[2].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.Endodontic.${field.key}`}
                checked={done.Endodontic?.[field.key as keyof typeof done.Endodontic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone", "Endodontic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Endodontic"
              id={`EndodonticOther-${index}`}
              name="other"
              value={done.Endodontic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone", "Endodontic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Implant / Maxillofacial Tab */}
        <TabsContent value="implant" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[3].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.ImplantMaxillofacial.${field.key}`}
                checked={done.ImplantMaxillofacial?.[field.key as keyof typeof done.ImplantMaxillofacial] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone", "ImplantMaxillofacial", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Implant/Maxillofacial"
              id={`ImplantMaxillofacialOther-${index}`}
              name="other"
              value={done.ImplantMaxillofacial?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone", "ImplantMaxillofacial", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Cosmetic / Aesthetic Dentistry Tab */}
        <TabsContent value="cosmetic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[4].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.CosmeticAesthetic.${field.key}`}
                checked={done.CosmeticAesthetic?.[field.key as keyof typeof done.CosmeticAesthetic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone", "CosmeticAesthetic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Cosmetic/Aesthetic"
              id={`CosmeticAestheticOther-${index}`}
              name="other"
              value={done.CosmeticAesthetic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone", "CosmeticAesthetic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Prosthodontics Tab */}
        <TabsContent value="prosthodontic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[5].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.Prosthodontic.${field.key}`}
                checked={done.Prosthodontic?.[field.key as keyof typeof done.Prosthodontic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone", "Prosthodontic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Prosthodontic"
              id={`ProsthodonticOther-${index}`}
              name="other"
              value={done.Prosthodontic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone", "Prosthodontic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Orthodontics Tab */}
        <TabsContent value="orthodontic" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {treatmentCategories[6].fields.map(field => (
              <CheckboxField
                key={field.key}
                label={field.label}
                name={`TreatmentDone.Orthodontic.${field.key}`}
                checked={done.Orthodontic?.[field.key as keyof typeof done.Orthodontic] as boolean || false}
                onChange={(e) => handleTreatmentCheckboxChange(e, field.key, index, "TreatmentDone", "Orthodontic", field.key)}
              />
            ))}
          </div>
          <div className="mt-3">
            <InputField
              label="Other Orthodontic"
              id={`OrthodonticOther-${index}`}
              name="other"
              value={done.Orthodontic?.other || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone", "Orthodontic", "other")}
              isTextArea={false}
            />
          </div>
        </TabsContent>

        {/* Tooth Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Tooth Number"
              id={`TreatmentDone[${index}].ToothNumber`}
              name="ToothNumber"
              value={done.ToothNumber || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone")}
            />
            <InputField
              label="Surface"
              id={`TreatmentDone[${index}].Surface`}
              name="Surface"
              value={done.Surface || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone")}
            />
            <InputField
              label="Quadrant"
              id={`TreatmentDone[${index}].Quadrant`}
              name="Quadrant"
              value={done.Quadrant || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone")}
            />
          </div>
          
          <div className="mt-4">
            <InputField
              label="Note"
              id={`TreatmentDone[${index}].Note`}
              name="Note"
              value={done.Note || ""}
              onChange={(e) => handleDynamicInputChange(e, index, "TreatmentDone")}
              isTextArea={true}
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>

      <button
        type="button"
        className="text-red-500 mt-4 flex items-center gap-1"
        onClick={() => handleRemoveEntry(index, "TreatmentDone")}
      >
        <DeleteOutlined />
        <span>Remove Entry</span>
      </button>
    </div>
  ))}
  <button
    type="button"
    className="bg-gray-500 text-white px-4 py-2 rounded-md mt-2 w-full sm:w-auto"
    onClick={() => handleAddEntry("TreatmentDone")}
  >
    + Add Treatment Done
  </button>
</div>
              <InputField
                label="Next Procedure"
                id="NextProcedure"
                name="NextProcedure"
                value={formData.NextProcedure}
                onChange={handleInputChange}
                isTextArea={true}
                rows={3}
              />

              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-md mt-4 hover:bg-green-600"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}