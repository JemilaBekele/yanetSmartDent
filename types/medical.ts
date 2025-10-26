type Vitalsign = {
    Core_Temperature?: string;
    Respiratory_Rate?: string;
    Blood_Oxygen?: string;
    Blood_Pressure?: string;
    heart_Rate?: string;
  };
  
  type TreatmentPlan = {
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
    other?: string;
  };
  
  export interface  FormData  {
    _id?: string;
    ChiefCompliance: string;
    Historypresent: string;
    Vitalsign: Vitalsign;
    Pastmedicalhistory: string;
    Pastdentalhistory: string;
    IntraoralExamination: string;
    ExtraoralExamination: string;
    Investigation: string;
    Assessment: string;
    TreatmentPlan: TreatmentPlan;
    TreatmentDone: TreatmentPlan;
    createdAt?: string;
  updatedAt?: string;
  createdBy?: { username: string }; // If TreatmentDone has the same structure as TreatmentPlan
  };