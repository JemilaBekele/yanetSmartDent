import { useMemo, useState } from "react";
import axios from "axios";
import PatientComponent from "../../patient/PatientComponent";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DeleteOutlined } from "@ant-design/icons";
// Define the types for the form data
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
  Overjet: string;
  OverjetNegativeValue: string;
  OverbitePercentage: string;
  ConcernsAndLimitations: string;
  Others: string;
  ChiefComplaint: ChiefComplaint;
  OralHabites: OralHabites;
  DentalHistory:DentalHistory;
  AngleClassification:AngleClassification;
  AnteriorCrossbite:AnteriorCrossbite;
  PosteriorCrossbite:PosteriorCrossbite;
  Mandible:Mandible;
  Maxilla:Maxilla;
  TreatmentType:TreatmentType;
  Openbite:Openbite;
  AdditionalOrthodonicAppliance:AdditionalOrthodonicAppliance;
  EstimatedTreatmentTime:EstimatedTreatmentTime;
  OrthodonticAppliance:OrthodonticAppliance;
  Retainer:Retainer;
  MedicalHistory: MedicalHistory;
  TreatmentPlan: TreatmentPlan[];
};

type OrthoFindingFormProps = {
  params: {
    id: string;
  };
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
  error?: string;
}) => (
  <div className="mt-6">
    <label htmlFor={id} className="block text-gray-700 font-semibold mb-2">
      {label}
    </label>
    {isTextArea ? (
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out ${error ? "border-red-500" : "border-gray-300"}`}
        rows={Math.max(3, Math.ceil(value.length / 100))}
      />
    ) : (
      <input
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`border-2 p-4 rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out ${error ? "border-red-500" : "border-gray-300"}`}
      />
    )}
    {error && <p className="text-red-500 mt-1 text-sm">{error}</p>}
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
  <div className="flex items-center space-x-4 mb-4">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      className="w-5 h-5 border-2 border-gray-300 rounded-md text-indigo-600 focus:ring-indigo-500 focus:ring-2 transition-all duration-200 ease-in-out"
    />
    <label className="text-gray-700 font-medium cursor-pointer select-none hover:text-indigo-600 transition-colors duration-200">
      {label}
    </label>
  </div>
);


const OrthodonticsForm = ({ params }: OrthoFindingFormProps) => {
  const patientId = params.id;
  const { data: session } = useSession();
  const role = useMemo(() => session?.user?.role || "", [session]);
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    Overjet: "",
    OverjetNegativeValue: "",
    OverbitePercentage: "",
    ConcernsAndLimitations: "",
    Others: "",
    ChiefComplaint: {
      None: false,
      ImproveMySmile: false,
      CrookedTeeth: false,
      Crowding: false,
      Spacing: false,
      Crown: false,
      Overbite: false,
      Underbite: false,
      Deepbite: false,
      Crossbite: false,
      ImpactedTeeth: false,
      other: "",
    },
    OralHabites: {
      None: false,
      ThumbSucking: false,
      Clenching: false,
      Bruxism: false,
      other: "",
    },
    MedicalHistory: {
      None: false,
      NKDA: false,
      AllergiestoPenicillin: false,
      other: "",
    },
    DentalHistory: {
      None: false,
      PreviousOrthodonticTreatment: false,
      MissingTooth: false,
      UnderSizedTooth: false,
      Attrition: false,
      ImpactedTooth: false,
      other: "",
    },
    AngleClassification: {
      I: false,
      IIdiv1: false,
      IIdiv2: false,
      III: false,
    },
    AnteriorCrossbite: {
      yes: false,
      No: false,
    },
    PosteriorCrossbite: {
      yes: false,
      No: false,
    },
    Mandible: {
      Crowding: false,
      Spacing: false,
    },
    Maxilla: {
      Crowding: false,
      Spacing: false,
    },
    Openbite: {
      yes: false,
      No: false,
    },
    TreatmentType: {
      Full: false,
      UpperOnly: false,
      LowerOnly: false,
      MonthRecall: false,
      other: "",
    },
    TreatmentPlan: [
      {
        Nonextraction: false,
        TrialNonExtraction: false,
        Extraction: false,
        TeethNumber: '',
      },
    ],
    AdditionalOrthodonicAppliance: {
      Elastics: false,
      RapidPalatalExpander: false,
      InterProximalReduction: false,
      SurgicalExposureofTeeth: false,
    },
    EstimatedTreatmentTime: {
      zeropointfive: false,
      onetoonepointfive: false,
      onepointfivetotwo: false,
      twototwopointfive: false,
      twopointfivetothree: false,
    },
    OrthodonticAppliance: {
      Traditional: false,
      Invisalign: false,
      Damon: false,
      DamonClear: false,
    },
    Retainer: {
      Essix: false,
      Fixed: false,
      Hawley: false,
    },
  });
  

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section: string,
    field: string
  ) => {
    const target = e.target as HTMLInputElement; // Explicitly cast the event target to HTMLInputElement
    const { value, type, checked } = target;
  
    let updatedValue: string | boolean = value; // Default to the value for input elements like text
  
    // If it's a checkbox or radio, use 'checked' instead of 'value'
    if (type === "checkbox" || type === "radio") {
      updatedValue = checked;
    }
  
    // Handle type conversion if needed (e.g., boolean to string for certain fields)
    if (typeof updatedValue === "boolean" && typeof formData[section][field] === "string") {
      updatedValue = updatedValue.toString(); // Convert boolean to string
    }
  
    setFormData((prev) => {
      // Handling for nested objects like ChiefComplaint, OralHabites, MedicalHistory, DentalHistory
      if (
        section === "ChiefComplaint" ||
        section === "OralHabites" ||
        section === "MedicalHistory" ||
        section === "DentalHistory" ||
        section === "TreatmentType" ||
        section === "AngleClassification" ||
        section === "AnteriorCrossbite" ||
        section === "PosteriorCrossbite" ||
        section === "Mandible" ||
        section === "Maxilla" ||
        section === "Openbite" ||
    
        section === "AdditionalOrthodonicAppliance" ||
        section === "EstimatedTreatmentTime" ||
        section === "OrthodonticAppliance" ||
        section === "Retainer"
      ) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: updatedValue,
          },
        };
      } else if (section === "TreatmentPlan") {
        const [key, index] = field.split("-");
        const updatedTreatmentPlan = [...prev.TreatmentPlan];
        updatedTreatmentPlan[parseInt(index)] = {
          ...updatedTreatmentPlan[parseInt(index)],
          [key]: updatedValue,
        };
        return { ...prev, TreatmentPlan: updatedTreatmentPlan };
      } else {
        return {
          ...prev,
          [field]: updatedValue,
        };
      }
    });
  };
  
  
  

  const handleAddTreatmentPlan = () => {
    setFormData((prev) => ({
      ...prev,
      TreatmentPlan: [
        ...prev.TreatmentPlan,
        {
          Nonextraction: false,
          TrialNonExtraction: false,
          Extraction: false,
          TeethNumber: "",
        },
      ],
    }));
  };
  const handleRemoveTreatmentPlan = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      TreatmentPlan: prev.TreatmentPlan.filter((_, i) => i !== index),
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(`/api/Orthodontics/add/${patientId}`, formData);
      if (response.status === 200) {
        if (role === "doctor") {
          router.push(`/doctor/Orthodontics/all/${patientId}`);
        } else if (role === "admin") {
          router.push(`/admin/Orthodontics/all/${patientId}`);
        }
      } else {
        alert("Error submitting data");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting data");
    }
  };

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <div className="flex space-x-8">
          <div className="w-1/3 p-4">
            <PatientComponent params={params} />
          </div>
          <div className="w-2/3 bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Orthodontic Treatment Form</h1>
            
                         <Image
                                              src="/assets/orth.jpg" // Path to your image
                                              alt="Example Image"
                                              width={500}  // Desired width
                                              height={50} // Desired height
                                              priority  
                                              className="rounded-lg shadow-md object-cover"
                                            />
            <form onSubmit={handleSubmit}>
              {/* Chief Complaint Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-2">Chief Complaint</h2>
                {Object.keys(formData.ChiefComplaint).map((key) => (
                  key !== "other" ? (
                    <CheckboxField
                      key={key}
                      label={key.replace(/([A-Z])/g, ' $1').trim()}
                      name={`ChiefComplaint-${key}`}
                      checked={!!formData.ChiefComplaint[key as keyof ChiefComplaint]}
                      onChange={(e) => handleInputChange(e, "ChiefComplaint", key)}
                    />
                  ) : (
                    <InputField
                      key={key}
                      label="Other"
                      id="ChiefComplaint-other"
                      name="ChiefComplaint-other"
                      value={formData.ChiefComplaint.other}
                      onChange={(e) => handleInputChange(e, "ChiefComplaint", "other")}
                      isTextArea
                    />
                  )
                ))}
              </div>
            
              
<div>
  <h2 className="text-lg font-semibold mb-2">Oral Habits</h2>
  {Object.keys(formData.OralHabites).map((key) => (
    key !== "other" ? (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()} // This adds spaces before uppercase letters for better display
        name={`OralHabites-${key}`}
        checked={!!formData.OralHabites[key as keyof OralHabites]}
        onChange={(e) => handleInputChange(e, "OralHabites", key)}
      />
    ) : null
  ))}
  <InputField
    label="Other Oral Habits"
    id="OralHabites-other"
    name="OralHabites-other"
    value={formData.OralHabites.other as string}
    onChange={(e) => handleInputChange(e, "OralHabites", "other")}
    isTextArea
  />
</div>



    </div>


             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Dental History */}

  <div>
  <h2 className="text-lg font-semibold mb-2">Contributory Medical History</h2>

  {/* Define custom labels for each field */}
  {[
    { key: 'None', label: 'No Medical History' },
    { key: 'NKDA', label: 'No Known Drug Allergies' },
    { key: 'AllergiestoPenicillin', label: 'Allergies to Penicillin' },
  ].map(({ key, label }) => (
    <CheckboxField
      key={key}
      label={label}  // Use your custom label here
      name={`MedicalHistory-${key}`}
      checked={!!formData.MedicalHistory[key as keyof MedicalHistory]}
      onChange={(e) => handleInputChange(e, 'MedicalHistory', key)}
    />
  ))}

  {/* Custom input field for "Other" */}
  <InputField
    label="Other Medical History"
    id="MedicalHistory-other"
    name="MedicalHistory-other"
    value={formData.MedicalHistory.other as string}
    onChange={(e) => handleInputChange(e, 'MedicalHistory', 'other')}
    isTextArea
  />
</div>

  <div>
    <h2 className="text-lg font-semibold mb-2">Contributory Dental History</h2>
    {Object.keys(formData.DentalHistory).map((key) => (
      key !== "other" ? (
        <CheckboxField
          key={key}
          label={key.replace(/([A-Z])/g, ' $1').trim()} // Adds spaces before uppercase letters
          name={`DentalHistory-${key}`}
          checked={!!formData.DentalHistory[key as keyof typeof formData.DentalHistory]}
          onChange={(e) => handleInputChange(e, "DentalHistory", key)}
        />
      ) : (
        <InputField
          key={key}
          label="Other Dental History"
          id="DentalHistory-other"
          name="DentalHistory-other"
          value={formData.DentalHistory.other}
          onChange={(e) => handleInputChange(e, "DentalHistory", "other")}
          isTextArea
        />
      )
    ))}
  </div>
 

</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Anterior Crossbite */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Anterior Crossbite</h2>
    {Object.keys(formData.AnteriorCrossbite).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`AnteriorCrossbite-${key}`}
        checked={!!formData.AnteriorCrossbite[key as keyof typeof formData.AnteriorCrossbite]}
        onChange={(e) => handleInputChange(e, "AnteriorCrossbite", key)}
      />
    ))}
  </div>
  {/* Mandible */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Mandible</h2>
    {Object.keys(formData.Mandible).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`Mandible-${key}`}
        checked={!!formData.Mandible[key as keyof typeof formData.Mandible]}
        onChange={(e) => handleInputChange(e, "Mandible", key)}
      />
    ))}
  </div>
  {/* Posterior Crossbite */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Posterior Crossbite</h2>
    {Object.keys(formData.PosteriorCrossbite).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`PosteriorCrossbite-${key}`}
        checked={!!formData.PosteriorCrossbite[key as keyof typeof formData.PosteriorCrossbite]}
        onChange={(e) => handleInputChange(e, "PosteriorCrossbite", key)}
      />
    ))}
  </div>


  {/* Angle Classification */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Angle Classification</h2>
    {Object.keys(formData.AngleClassification).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`AngleClassification-${key}`}
        checked={!!formData.AngleClassification[key as keyof typeof formData.AngleClassification]}
        onChange={(e) => handleInputChange(e, "AngleClassification", key)}
      />
    ))}
  </div>
  {/* Maxilla */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Maxilla</h2>
    {Object.keys(formData.Maxilla).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`Maxilla-${key}`}
        checked={!!formData.Maxilla[key as keyof typeof formData.Maxilla]}
        onChange={(e) => handleInputChange(e, "Maxilla", key)}
      />
    ))}
  </div>

  {/* Openbite */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Openbite</h2>
    {Object.keys(formData.Openbite).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`Openbite-${key}`}
        checked={!!formData.Openbite[key as keyof typeof formData.Openbite]}
        onChange={(e) => handleInputChange(e, "Openbite", key)}
      />
    ))}
  </div>
</div>

<div>
    <h2 className="text-lg font-semibold mb-2">Orthodontic Details</h2>
    
    <InputField
      label="Over jet(mm)"
      id="Overjet"
      name="Overjet"
      value={formData.Overjet}
      onChange={(e) => handleInputChange(e, "Overjet", "Overjet")}
    />
    
    <InputField
      label="Overjet(mm) If Negative Value"
      id="OverjetNegativeValue"
      name="OverjetNegativeValue"
      value={formData.OverjetNegativeValue}
      onChange={(e) => handleInputChange(e, "OverjetNegativeValue", "OverjetNegativeValue")}
    />
    
    <InputField
      label="Overbite Percentage"
      id="OverbitePercentage"
      name="OverbitePercentage"
      value={formData.OverbitePercentage}
      onChange={(e) => handleInputChange(e, "OverbitePercentage", "OverbitePercentage")}
    />
    
    <InputField
      label="Concerns and Limitations"
      id="ConcernsAndLimitations"
      name="ConcernsAndLimitations"
      value={formData.ConcernsAndLimitations}
      onChange={(e) => handleInputChange(e, "ConcernsAndLimitations", "ConcernsAndLimitations")}
      isTextArea
    />
    </div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Treatment Type */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Treatment Type</h2>
    {Object.keys(formData.TreatmentType).map((key) => (
      key !== "other" ? (
        <CheckboxField
          key={key}
          label={
            key === "MonthRecall" 
              ? "6 Month Recall" // Custom label for MonthRecall
              : key.replace(/([A-Z])/g, ' $1').trim() // Default dynamic label
          } // Adds spaces before uppercase letters
          name={`TreatmentType-${key}`}
          checked={!!formData.TreatmentType[key as keyof typeof formData.TreatmentType]}
          onChange={(e) => handleInputChange(e, "TreatmentType", key)}
        />
      ) : (
        <InputField
          key={key}
          label="Other Treatment Type"
          id="TreatmentType-other"
          name="TreatmentType-other"
          value={formData.TreatmentType.other}
          onChange={(e) => handleInputChange(e, "TreatmentType", "other")}
          isTextArea
        />
      )
    ))}
  </div>

  {/* Additional Orthodontic Appliance */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Additional Orthodontic Appliance</h2>
    {Object.keys(formData.AdditionalOrthodonicAppliance).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`AdditionalOrthodonicAppliance-${key}`}
        checked={!!formData.AdditionalOrthodonicAppliance[key as keyof typeof formData.AdditionalOrthodonicAppliance]}
        onChange={(e) => handleInputChange(e, "AdditionalOrthodonicAppliance", key)}
      />
    ))}
  </div>

  {/* Estimated Treatment Time */}
  <div>
  <h2 className="text-lg font-semibold mb-2">Estimated Treatment Time</h2>
  {Object.keys(formData.EstimatedTreatmentTime).map((key) => {
    // Define custom numeric labels
    const customLabels: Record<string, string> = {
      zeropointfive: "0.5 years",
      onetoonepointfive: "1 to 1.5 years",
      onepointfivetotwo: "1.5 to 2 years",
      twototwopointfive: "2 to 2.5 years",
      twopointfivetothree: "2.5 to 3 years",
    };

    return (
      <CheckboxField
        key={key}
        label={customLabels[key]} // Use the custom label from the mapping
        name={`EstimatedTreatmentTime-${key}`}
        checked={!!formData.EstimatedTreatmentTime[key as keyof typeof formData.EstimatedTreatmentTime]}
        onChange={(e) => handleInputChange(e, "EstimatedTreatmentTime", key)}
      />
    );
  })}
</div>


  {/* Orthodontic Appliance */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Orthodontic Appliance</h2>
    {Object.keys(formData.OrthodonticAppliance).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`OrthodonticAppliance-${key}`}
        checked={!!formData.OrthodonticAppliance[key as keyof typeof formData.OrthodonticAppliance]}
        onChange={(e) => handleInputChange(e, "OrthodonticAppliance", key)}
      />
    ))}
  </div>

  {/* Retainer */}
  <div>
    <h2 className="text-lg font-semibold mb-2">Retainer</h2>
    {Object.keys(formData.Retainer).map((key) => (
      <CheckboxField
        key={key}
        label={key.replace(/([A-Z])/g, ' $1').trim()}
        name={`Retainer-${key}`}
        checked={!!formData.Retainer[key as keyof typeof formData.Retainer]}
        onChange={(e) => handleInputChange(e, "Retainer", key)}
      />
    ))}
  </div>
</div>

<div>
  <h2 className="text-lg font-semibold mb-2">Treatment Plan</h2>
  {formData.TreatmentPlan.map((plan, index) => (
    <div key={index} className="border p-4 mb-4">
      {Object.keys(plan).map((key) => {
        if (key === "TeethNumber") {
          return (
            <InputField
              key={`${key}-${index}`}
              label="Tooth Number"
              id={`TreatmentPlan-${key}-${index}`}
              name={`TreatmentPlan-${key}-${index}`}
              value={plan[key as keyof TreatmentPlan] as string}
              onChange={(e) => handleInputChange(e, "TreatmentPlan", `${key}-${index}`)}
              isTextArea
            />
          );
        }
        return (
          <CheckboxField
            key={`${key}-${index}`}
            label={key.replace(/([A-Z])/g, ' $1').trim()} 
            name={`TreatmentPlan-${key}-${index}`}
            checked={plan[key as keyof TreatmentPlan] as boolean}
            onChange={(e) => handleInputChange(e, "TreatmentPlan", `${key}-${index}`)}
          />
        );
      })}

      <button
        type="button"
        onClick={() => handleRemoveTreatmentPlan(index)}
        className="mt-2 p-2 text-red-500 rounded"
      >
        <DeleteOutlined/>
      </button>
    </div>
  ))}

  <button
    type="button"
    onClick={handleAddTreatmentPlan}
    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
  >
   + Add Treatment Plan
  </button>
</div>


              <div>
    
    
    
    <InputField
      label="Others"
      id="Others"
      name="Others"
      value={formData.Others}
      onChange={(e) => handleInputChange(e, "Others", "Others")}
      isTextArea
    />
    </div>
              <button
                type="submit"
                className="mt-4 p-2 bg-green-500 text-white rounded"
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrthodonticsForm;
