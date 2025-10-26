import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import PatientComponent from "../../patient/PatientComponent";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { branch } from "../Consent/all";
type ChiefComplaint = {
  None: boolean;
  ImproveMySmile: boolean;
  CrookedTeeth: boolean;
  Crowding: boolean;
  Spacing: boolean;
  Crown: boolean;
  Overbite: boolean;
  Underbite: boolean;
  Deepbite: boolean;
  Crossbite: boolean;
  ImpactedTeeth: boolean;
  other: string;
};

type OralHabites = {
  None: boolean;
  ThumbSucking: boolean;
  Clenching: boolean;
  Bruxism: boolean;
  other: string | boolean;
};

type MedicalHistory = {
  None: boolean;
  NKDA: boolean;
  AllergiestoPenicillin: boolean;
  other: string | boolean;
};

type TreatmentPlan = {
  Nonextraction: boolean;
  TrialNonExtraction: boolean;
  Extraction: boolean;
  TeethNumber: string;
};

type DentalHistory = {
  None: boolean;
  PreviousOrthodonticTreatment: boolean;
  MissingTooth: boolean;
  UnderSizedTooth: boolean;
  Attrition: boolean;
  ImpactedTooth: boolean;
  other: string;
};
type AngleClassification = {
  I: boolean;
  IIdiv1: boolean;
  IIdiv2: boolean;
  III: boolean;
};
type AnteriorCrossbite = {
  yes: boolean;
  No: boolean;
 
};

type PosteriorCrossbite = {
  yes: boolean;
  No: boolean;
 
};

type Mandible = {
  Crowding: boolean;
  Spacing: boolean;
 
};

type Maxilla = {
  Crowding: boolean;
  Spacing: boolean;
 
};
type Openbite = {
  yes: boolean;
  No: boolean;
 
};

type AdditionalOrthodonicAppliance = {
  Elastics: boolean;
  RapidPalatalExpander: boolean;
  InterProximalReduction: boolean;
  SurgicalExposureofTeeth: boolean;
};

type EstimatedTreatmentTime = {
  zeropointfive: boolean;
  onetoonepointfive: boolean;
  onepointfivetotwo: boolean;
  twototwopointfive: boolean;
  twopointfivetothree: boolean;
};

type OrthodonticAppliance = {
  Traditional: boolean;
  Invisalign: boolean;
  Damon: boolean;
  DamonClear: boolean;
};

type Retainer = {
  Essix: boolean;
  Fixed: boolean;
  Hawley: boolean;
};

type TreatmentType = {
  Full: boolean;
  UpperOnly: boolean;
  LowerOnly: boolean;
  MonthRecall: boolean;
  other: string;
};




type FormData = {
  _id:string;
  createdAt?: string;
  changeHistory?: { updatedBy: { username: string }; updateTime: string }[];
  updatedAt?: string;
  createdBy?: { username: string };
  length: number;
  Overjet: string;
  OverjetNegativeValue: string;
  OverbitePercentage: string;
  ConcernsAndLimitations: string;
  Others: string;
  ChiefComplaint: ChiefComplaint;
  OralHabites: OralHabites;
  DentalHistory: DentalHistory;
  AngleClassification: AngleClassification;
  AnteriorCrossbite: AnteriorCrossbite;
  PosteriorCrossbite: PosteriorCrossbite;
  Mandible: Mandible;
  Maxilla: Maxilla;
  TreatmentType: TreatmentType;
  Openbite: Openbite;
  AdditionalOrthodonicAppliance: AdditionalOrthodonicAppliance;
  EstimatedTreatmentTime: EstimatedTreatmentTime;
  OrthodonticAppliance: OrthodonticAppliance;
  Retainer: Retainer;
  branch: branch;
  MedicalHistory: MedicalHistory;
  TreatmentPlan: TreatmentPlan[];
};

type OrthoFindingFormProps = {
  params: {
    id: string;
  };
};

const OrthodonticsDisplay = ({ params }: OrthoFindingFormProps) => {
  const patientId = params.id;
  const [data, setData] = useState<FormData[] | null>(null);
const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/Orthodontics/add/${patientId}`);

        console.log(response.data.data)
        setData(response.data.data); // Access the data array here
        console.log(response.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [patientId]);

  const labels = {
    ChiefComplaint: {
      None: "None",
      ImproveMySmile: "Improve My Smile",
      CrookedTeeth: "Crooked Teeth",
      Crowding: "Crowding",
      Spacing: "Spacing",
      Crown: "Crown Issues",
      Overbite: "Overbite",
      Underbite: "Underbite",
      Deepbite: "Deepbite",
      Crossbite: "Crossbite",
      ImpactedTeeth: "Impacted Teeth",
      other: "Other",
    },
    OralHabites: {
      None: "None",
      Thumbdigitsucking: "Thumb or Digit Sucking",
      Clenching: "Clenching",
      Bruxism: "Bruxism",
      other: "Other",
    },
    DentalHistory: {
      None: "None",
      PreviousOrthodontic: "Previous Orthodontic Treatment",
      MissingTooth: "Missing Tooth",
      UnderSizedTooth: "Undersized Tooth",
      Attrition: "Attrition",
      ImpactedTooth: "Impacted Tooth",
      other: "Other",
    },
    MedicalHistory: {
      None: "None",
      NKDA: "No Known Drug Allergies",
      AllergiestoPenicillin: "Allergies to Penicillin",
      other: "Other",
    },
    TreatmentPlan: {
      other: "Other",
      Nonextraction: "Non-Extraction",
      TrialNonExtraction: "Trial Non-Extraction",
      Extraction: "Extraction",
      TeethNumber: "Teeth Number",
    },
    AngleClassification: {
      I: "I",
      IIdiv1: "IIdiv1",
      IIdiv2: "IIdiv2",
      III: "III",
    },
    AnteriorCrossbite: {
      yes: "Yes",
      No: "No",
    },
    PosteriorCrossbite: {
      yes: "Yes",
      No: "No",
    },
    Mandible: {
      Crowding: "Crowding",
      Spacing: "Spacing",
    },
    Maxilla: {
      Crowding: "Crowding",
      Spacing: "Spacing",
    },
    Openbite: {
      yes: "Yes",
      No: "No",
    },
    TreatmentType:{
      Full: "Full",
      UpperOnly: "Upper Only",
      LowerOnly: "Lower Only",
      MonthRecall: "6 Month Recall",
      other: "Other"
    },
    AdditionalOrthodonicAppliance: {
      Elastics: "Elastics",
      RapidPalatalExpander: "Rapid Palatal Expander",
      InterProximalReduction: "Interproximal Reduction",
      SurgicalExposureofTeeth: "Surgical Exposure of Teeth",
    },
    EstimatedTreatmentTime: {
      zeropointfive: "0 - 0.5 years",
      onetoonepointfive: "1 - 1.5 years",
      onepointfivetotwo: "1.5 - 2 years",
      twototwopointfive: "2 - 2.5 years",
      twopointfivetothree: "2.5 - 3 years",
    },
    OrthodonticAppliance: {
      Traditional: "Traditional",
      Invisalign: "Invisalign",
      Damon: "Damon",
      DamonClear: "Damon Clear",
    },
    Retainer: {
      Essix: "Essix Retainer",
      Fixed: "Fixed Retainer",
      Hawley: "Hawley Retainer",
    },
   
  };
  
  const displaySection = (
    section: ChiefComplaint | AnteriorCrossbite | PosteriorCrossbite | Mandible | Maxilla | Openbite | TreatmentType| AdditionalOrthodonicAppliance | EstimatedTreatmentTime | OrthodonticAppliance | Retainer | AngleClassification | OralHabites | MedicalHistory | DentalHistory | TreatmentPlan, 
    sectionKey: string
  ) => {
    const sectionLabels = labels[sectionKey] || {};
  
    return Object.keys(section)
      .map((key) => {
        const value = section[key as keyof typeof section]; // Properly type the key
        const label = sectionLabels[key as keyof typeof sectionLabels] || key.replace(/([A-Z])/g, " $1");
  
        // Check for boolean values
        if (typeof value === "boolean") {
          return value ? label : ''; // Return label if true, otherwise empty string
        } 
        
        // Check if value is a string and is not empty, then return it
        if (typeof value === "string" && value && value !== "None" && value !== "other:") {
          return `${label}: ${value}`; // Only return if value is not empty or invalid
        }
  
        return null; // Return null for values that are empty or invalid
      })
      .filter(Boolean) // Remove null or undefined values
      .join(", ");
  };
  
  

  
  
  
  const renderortho = (
    ChiefComplaint: ChiefComplaint,
    OralHabites: OralHabites,
    DentalHistory: DentalHistory,
    AngleClassification: AngleClassification,
    AnteriorCrossbite: AnteriorCrossbite,
    PosteriorCrossbite: PosteriorCrossbite,
    Mandible: Mandible,
    Maxilla: Maxilla,
    TreatmentType: TreatmentType,
    Openbite: Openbite, 
    AdditionalOrthodonicAppliance: AdditionalOrthodonicAppliance,
    EstimatedTreatmentTime: EstimatedTreatmentTime,
    OrthodonticAppliance: OrthodonticAppliance,
    Retainer: Retainer,
    MedicalHistory: MedicalHistory,

  ) => {
    const renderSection = (
      sectionData: ChiefComplaint | AnteriorCrossbite | PosteriorCrossbite | Mandible | Maxilla | Openbite |TreatmentType | AdditionalOrthodonicAppliance | EstimatedTreatmentTime | OrthodonticAppliance | Retainer | AngleClassification | OralHabites | MedicalHistory | DentalHistory | TreatmentPlan,
      sectionKey: string,
      title: string
    ) => {
      const sectionContent = displaySection(sectionData, sectionKey);
  
      // Check if sectionContent is a string and has non-whitespace content
      if (typeof sectionContent === 'string' && sectionContent.trim() !== '') {
        return `
          <div class="section">
            <h3 class="dsf">${title}</h3>
            <div>${sectionContent}</div>
          </div>
        `;
      }
  
      return ''; // Return empty string if no content
    };
  
    return `
      <style>
  
container {
margin:10px
}
  .dsf {
    color: #2c3e50;
    border-left: 5px solid #3498db;
    padding-left: 10px;
    margin-top: 20px;
    margin-bottom: 3px;
    font-weight: bold;
  }

  .section-container {
    padding: 20px;
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 5px;
  }

  .section-container > div {
    
    line-height: 1.6;
  }

  .treatment-plan {
    margin-top: 15px;
  }

  .treatment-plan p {
    margin: 5px 0;
    color: #34495e;
  }

  .sections-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
</style>

<div class="container">
  <div class="section-container">
  
    ${renderSection(ChiefComplaint, "ChiefComplaint", "Chief Complaint")}
   
    ${renderSection(OralHabites, "OralHabites", "Oral Habits")}

      ${renderSection(MedicalHistory, "MedicalHistory", "Contributory Medical History")}

    ${renderSection(DentalHistory, "DentalHistory", "Contributory Dental History")}
    
    ${renderSection(AngleClassification, "AngleClassification", "Angle Classification")}
  
    ${renderSection(AnteriorCrossbite, "AnteriorCrossbite", "Anterior Crossbite")}
  
    ${renderSection(PosteriorCrossbite, "PosteriorCrossbite", "Posterior Crossbite")}
 
    ${renderSection(Mandible, "Mandible", "Mandible")}

    ${renderSection(Maxilla, "Maxilla", "Maxilla")}
  
    ${renderSection(Openbite, "Openbite", "Openbite")}

     ${renderSection(TreatmentType, "TreatmentType", "Treatment Type")}
  
    ${renderSection(AdditionalOrthodonicAppliance, "AdditionalOrthodonicAppliance", "Additional Orthodontic Appliance")}

    ${renderSection(EstimatedTreatmentTime, "EstimatedTreatmentTime", "Estimated Treatment Time")}
 
    ${renderSection(OrthodonticAppliance, "OrthodonticAppliance", "Orthodontic Appliance")}

    ${renderSection(Retainer, "Retainer", "Retainer")}

  
    
  </div>
</div>
    `;
  };

  const displaySect = (
    section: ChiefComplaint | AnteriorCrossbite | PosteriorCrossbite | Mandible | Maxilla | Openbite | AdditionalOrthodonicAppliance | EstimatedTreatmentTime | OrthodonticAppliance | Retainer | AngleClassification | OralHabites | MedicalHistory | DentalHistory | TreatmentPlan, 
    sectionKeys: string[] // Array of keys
  ) => {
    const sectionLabels = sectionKeys.reduce((acc, key) => {
      // Exclude '_id' from the keys we want to process
      if (key !== "_id") {
        acc[key] = labels[key] || key.replace(/([A-Z])/g, " $1");
      }
      return acc;
    }, {} as Record<string, string>);
  
    return sectionKeys
      .filter(key => key !== "_id") // Filter out '_id'
      .map((key) => {
        const value = section[key as keyof typeof section]; // Get value for each key
        const label = sectionLabels[key] || key.replace(/([A-Z])/g, " $1");
  
        // Check for boolean values
        if (typeof value === "boolean") {
          return value ? label : ''; // Return label if true, otherwise empty string
        }
  
        // Check if value is a string and is not empty, then return it
        if (typeof value === "string" && value && value !== "None" && value !== "other:") {
          return `${label}: ${value}`; // Only return if value is not empty or invalid
        }
  
        return null; // Return null for values that are empty or invalid
      })
      .filter(Boolean) // Remove null or undefined values
      .join(", ");
  };
  
  
  
  

  
  
  
  const renderort = (TreatmentPlan: TreatmentPlan[]) => {
    const renderSection = (
      sectionData: TreatmentPlan,
      sectionKey: string
    ) => {
      const sectionContent = displaySect(sectionData, [sectionKey]); // Wrap in an array
  
      // Check if sectionContent is a string and has non-whitespace content
      if (typeof sectionContent === 'string' && sectionContent.trim() !== '') {
        return `${sectionContent.trim()}`; // Wrap each content in quotes and trim spaces
      }
  
      return ''; // Return empty string if no content
    };
  
    return `
      <style>
        .container {
          
        }
        .dsf {
          color: #2c3e50;
          border-left: 5px solid #3498db;
          padding-left: 10px;
          margin-bottom: 3px;
          font-weight: bold;
        }
        .section-container {
          padding: 20px;
          background-color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border-radius: 5px;
        }
        .section-container > div {
          line-height: 1.6;
        }
        .treatment-plan {
          margin-top: 15px;
        }
        .treatment-plan p {
          margin: 5px 0;
          color: #34495e;
        }
        .sections-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
      </style>
  
      <div class="container">
        <div class="section-container">
          <div class="treatment-plan">
            <h3 class="dsf">Treatment Plan</h3>
            <p>
              ${TreatmentPlan?.map((plan, index) => `
                Plan ${index + 1}: 
                ${["Nonextraction", "TrialNonExtraction", "Extraction", "TeethNumber", "other"]
                  .map(key => renderSection(plan, key)) // Call renderSection for each key
                  .filter(Boolean) // Filter out any empty values
                  .join(", ")}  <!-- Join with commas -->
              `).join(" ")}
            </p>
          </div>
        </div>
      </div>
    `;
  };
  
  
  
  const handleDelete = async (recordId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this medical finding? This action cannot be undone."
    );
  
    if (!confirmDelete) {
      return; // Exit if the user cancels the action
    }
  
    const toastId = toast.loading("Deleting record...");
  
    try {
      const response = await axios.delete(`/api/Orthodontics/all/${recordId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (response.data.success) {
        setData((prevFindings) =>
          prevFindings ? prevFindings.filter((data) => data._id !== recordId) : []
        );
  
        toast.update(toastId, {
          render: "Health Information deleted successfully!",
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
  


  const handleEdit = (patientId: string, findingId: string) => {
    if (role === "doctor") {
      router.push(`/doctor/Orthodontics/edit?findingId=${findingId}&patientId=${patientId}`);
    } else if (role === "admin") {
      router.push(`/admin/Orthodontics/edit?findingId=${findingId}&patientId=${patientId}`);
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

  if (!data) return <div>Loading...</div>;

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Orthodontics Record</h1>
              {role === "admin" && (
                <Link
                  href={`/admin/Orthodontics/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Record +
                </Link>
              )}
              {role === "doctor" && (
                <Link
                  href={`/doctor/Orthodontics/add/${patientId}`}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  New Record +
                </Link>
              )}
            </div>
            {Array.isArray(data) && data.length === 0 ? (
              <p className="text-gray-500">No Orthodontics Record findings available.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {Array.isArray(data) ? (
                  data.map((item) => (
                    <div
                      key={item._id}
                      className="border p-4 rounded-lg shadow-md flex items-start justify-between"
                    >
                      <div className="flex flex-col space-y-1">
                        <div className="text-green-600 text-base p-1 font-bold">
                          {item.branch?.name || ""}
                        </div>
                         <div className="text-gray-600 text-sm p-1 font-bold">
                          {item.createdBy?.username || "Unknown"}
                        </div>
                        <div className="text-gray-600 text-sm p-1">
                          {new Date(item.createdAt || "").toLocaleString()}
                        </div>
                        <div className="text-gray-600 text-sm p-2"> {renderUpdates(item.changeHistory)}</div>
                      </div>
                      <div className="flex-grow px-4">
  {/*
    Only render the content if renderortho returns non-empty HTML.
  */}
  {renderortho(
  item.ChiefComplaint,
  item.OralHabites,
  item.DentalHistory,
  item.AngleClassification,
  item.AnteriorCrossbite,
  item.PosteriorCrossbite,
  item.Mandible,
  item.Maxilla,
  item.TreatmentType,
  item.Openbite,
  item.AdditionalOrthodonicAppliance,
  item.EstimatedTreatmentTime,
  item.OrthodonticAppliance,
  item.Retainer,
  item.MedicalHistory, // Removed duplicated `TreatmentType`
).trim() ? (
  <div
    dangerouslySetInnerHTML={{
      __html: renderortho(
        item.ChiefComplaint,
        item.OralHabites,
        item.DentalHistory,
        item.AngleClassification,
        item.AnteriorCrossbite,
        item.PosteriorCrossbite,
        item.Mandible,
        item.Maxilla,
        item.TreatmentType,
        item.Openbite,
        item.AdditionalOrthodonicAppliance,
        item.EstimatedTreatmentTime,
        item.OrthodonticAppliance,
        item.Retainer,
        item.MedicalHistory, // Removed duplicated `TreatmentType`
      ),
    }}
  />
) : null}

<div className="flex-grow ">
  {item.Overjet && (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-800 border-l-8 border-blue-400 pl-3 mb-2">
  Overjet (mm)
</h3>

      <p className="text-base text-gray-700 leading-relaxed">
        {item.Overjet.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  )}

{item.OverjetNegativeValue && (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-800 border-l-8 border-blue-400 pl-3 mb-2">
      Overjet (mm) Negative Value
</h3>

      <p className="text-base text-gray-700 leading-relaxed">
        {item.OverjetNegativeValue.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  )}

{item.OverbitePercentage && (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-800 border-l-8 border-blue-400 pl-3 mb-2">
      Overbite Percentage
</h3>

      <p className="text-base text-gray-700 leading-relaxed">
        {item.OverbitePercentage.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  )}

{item.ConcernsAndLimitations && (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-800 border-l-8 border-blue-400 pl-3 mb-2">
      Concerns And Limitations
</h3>

      <p className="text-base text-gray-700 leading-relaxed">
        {item.ConcernsAndLimitations.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  )}

{item.Others && (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-800 border-l-8 border-blue-400 pl-3 mb-2">
      Others
</h3>

      <p className="text-base text-gray-700 leading-relaxed">
        {item.Others.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  )}



</div>



{renderort(
    
    item.TreatmentPlan
  ).trim() ? (
    <div
      dangerouslySetInnerHTML={{
        __html: renderort(
          
         
          item.TreatmentPlan
        ),
      }}
    />
  ) : null}
</div>
<div className="flex flex-col space-y-2">
{(role === "doctor" || role === "admin") && (
  <>
                      <button
                        className="hover:bg-blue-300 p-2 rounded-full"
                        onClick={() => handleEdit(patientId, item._id)}
                      >
                        <EditOutlined className="text-xl text-blue-500" />
                      </button>
                      <button
                        className="hover:bg-red-300 p-2 rounded-full"
                        onClick={() => handleDelete(item._id)}
                      >
                        <DeleteOutlined className="text-xl text-red-500" />
                      </button></>)}
                    </div>
                    </div>
                    
                  ))
                ) : (
                  <div className="text-gray-500">Invalid data format</div>
                  
                )}
              </div>
            )}
          </div>
        </div>  <ToastContainer />
      </div>
    </div>
  );
};

export default OrthodonticsDisplay;
