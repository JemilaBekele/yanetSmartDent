
export type ChiefComplaint = {
    None?: boolean;
    ImproveMySmile?: boolean;
    CrookedTeeth?: boolean;
    Crowdling?: boolean;
    Spacing?: boolean;
    Crown?: boolean;
    Overbite?: boolean;
    Underbite?: boolean;
    Deepbite?: boolean;
    Crossbite?: boolean;
    ImpactedTeeth?: boolean;
    other?: string;
  };
  
  export type OralHabits = {
    None?: boolean;
    Thumbdigitsucking?: boolean;
    Clenching?: boolean;
    Bruxism?: boolean;
    other?: string;
  };
  
  export type MedicalHistory = {
    None?: boolean;
    NKDA?: boolean;
    AllergiestoPenicillin?: boolean;
    other?: string;
  };
  
  export type DentalHistory = {
    None?: boolean;
    PreviousOrthodontic?: boolean;
    MissingTooth?: boolean;
    UnderSizedTooth?: boolean;
    Attrition?: boolean;
    ImpactedTooth?: boolean;
    other?: string;
  };
  
  export type AngleClassification = {
    I?: boolean;
    IIdiv1?: boolean;
    IIdiv2?: boolean;
    III?: boolean;
  };
  
  export type AnteriorCrossbite = {
    Yes?: boolean;
    No?: boolean;
  };
  
  export type PosteriorCrossbite = {
    Yes?: boolean;
    No?: boolean;
  };
  
  export type Mandible = {
    Crowdling?: boolean;
    Spacing?: boolean;
  };
  
  export type Maxilla = {
    Crowdling?: boolean;
    Spacing?: boolean;
  };
  
  export type Openbite = {
    Yes?: boolean;
    No?: boolean;
  };
  
  export type TreatmentType = {
    Full?: boolean;
    UpperOnly?: boolean;
    LowerOnly?: boolean;
    MonthRecall?: boolean;
    other?: string;
  };
  
  export type AdditionalOrthodonticAppliance = {
    Elastics?: boolean;
    RapidPalatalExpander?: boolean;
    InterProximalReduction?: boolean;
    SurgicalExposureofTeeth?: boolean;
  };
  
  export type EstimatedTreatmentTime = {
    zeropointfive?: boolean;
    onetoonepointfive?: boolean;
    onepointfivetotwo?: boolean;
    twototwopointfive?: boolean;
    twopointfivetothree?: boolean;
  };
  
  export type OrthodonticAppliance = {
    Traditional?: boolean;
    Invisalign?: boolean;
    Damon?: boolean;
    DamonClear?: boolean;
  };
  
  export type Retainer = {
    Essix?: boolean;
    Fixed?: boolean;
    Hawley?: boolean;
  };
  
  // Combine all into a single comprehensive type
  export type OrthodonticRecord = {
    ChiefComplaint: ChiefComplaint;
    OralHabits: OralHabits;
    MedicalHistory: MedicalHistory;
    DentalHistory: DentalHistory;
    AngleClassification: AngleClassification;
    AnteriorCrossbite: AnteriorCrossbite;
    PosteriorCrossbite: PosteriorCrossbite;
    Mandible: Mandible;
    Maxilla: Maxilla;
    Openbite: Openbite;
    TreatmentType: TreatmentType;
    AdditionalOrthodonticAppliance: AdditionalOrthodonticAppliance;
    EstimatedTreatmentTime: EstimatedTreatmentTime;
    OrthodonticAppliance: OrthodonticAppliance;
    Retainer?: Retainer;
    Overjet: string;
    OverjetNegativeValue: string;
    OverbitePercentage: string;
    ConcernsAndLimitations: string;
    Others: string;
  };
  
  