import mongoose from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

// 🦷 Sub-schema for treatment categories
const treatmentCategorySchema = new mongoose.Schema({
  // ✅ General Treatments
  Extraction: { type: Boolean, default: false },
  Scaling: { type: Boolean, default: false },
  Rootcanal: { type: Boolean, default: false },
  Filling: { type: Boolean, default: false },
  Bridge: { type: Boolean, default: false },
  Crown: { type: Boolean, default: false },
  Apecectomy: { type: Boolean, default: false },
  Fixedorthodonticappliance: { type: Boolean, default: false },
  Removableorthodonticappliance: { type: Boolean, default: false },
  Removabledenture: { type: Boolean, default: false },
  Splinting: { type: Boolean, default: false },

  // ✅ Restorative Dentistry
  Restorative: {
    AmalgamFilling: { type: Boolean, default: false },
    CompositeFilling: { type: Boolean, default: false },
    GlassIonomer: { type: Boolean, default: false },
    TemporaryFilling: { type: Boolean, default: false },
    CrownPreparation: { type: Boolean, default: false },
    CrownCementation: { type: Boolean, default: false },
    VeneerPlacement: { type: Boolean, default: false },
    CoreBuildUp: { type: Boolean, default: false },
    OnlayInlay: { type: Boolean, default: false },
    ToothRecontouring: { type: Boolean, default: false },
    other: { type: String },
  },

  // ✅ Endodontics
  Endodontic: {
    RootCanalTreatment: { type: Boolean, default: false },
    ReRootCanalTreatment: { type: Boolean, default: false },
    PulpCappingDirect: { type: Boolean, default: false },
    PulpCappingIndirect: { type: Boolean, default: false },
    Pulpectomy: { type: Boolean, default: false },
    Pulpotomy: { type: Boolean, default: false },
    Apexification: { type: Boolean, default: false },
    Apicoectomy: { type: Boolean, default: false },
    RootCanalPost: { type: Boolean, default: false },
    other: { type: String },
  },

  // ✅ Implant / Maxillofacial
  ImplantMaxillofacial: {
    ImplantPlacement: { type: Boolean, default: false },
    BoneGraft: { type: Boolean, default: false },
    RidgeAugmentation: { type: Boolean, default: false },
    SinusLift: { type: Boolean, default: false },
    SoftTissueGraft: { type: Boolean, default: false },
    ImplantExposure: { type: Boolean, default: false },
    ImplantCrownDelivery: { type: Boolean, default: false },
    MaxillofacialFractureRepair: { type: Boolean, default: false },
    TMJDisorderManagement: { type: Boolean, default: false },
    other: { type: String },
  },

  // ✅ Cosmetic / Aesthetic Dentistry
  CosmeticAesthetic: {
    TeethWhiteningOffice: { type: Boolean, default: false },
    TeethWhiteningHomeKit: { type: Boolean, default: false },
    CompositeBonding: { type: Boolean, default: false },
    DiastemaClosure: { type: Boolean, default: false },
    VeneerPorcelain: { type: Boolean, default: false },
    SmileMakeover: { type: Boolean, default: false },
    GumContouring: { type: Boolean, default: false },
    GingivalDepigmentation: { type: Boolean, default: false },
    EnamelMicroabrasion: { type: Boolean, default: false },
    ToothJewelry: { type: Boolean, default: false },
    other: { type: String },
  },

  // ✅ Prosthodontics
  Prosthodontic: {
    CompleteDenture: { type: Boolean, default: false },
    PartialDenture: { type: Boolean, default: false },
    FlexibleDenture: { type: Boolean, default: false },
    ImplantSupportedOverdenture: { type: Boolean, default: false },
    FixedPartialDenture: { type: Boolean, default: false },
    CrownAndBridgeMaintenance: { type: Boolean, default: false },
    ReliningRebasing: { type: Boolean, default: false },
    DentureRepair: { type: Boolean, default: false },
    OcclusalAdjustment: { type: Boolean, default: false },
    NightGuardFabrication: { type: Boolean, default: false },
    other: { type: String },
  },

  // ✅ Orthodontics
  Orthodontic: {
    FixedAppliance: { type: Boolean, default: false },
    RemovableAppliance: { type: Boolean, default: false },
    RetainerPlacement: { type: Boolean, default: false },
    BracketBonding: { type: Boolean, default: false },
    WireChange: { type: Boolean, default: false },
    Debonding: { type: Boolean, default: false },
    SpaceMaintainer: { type: Boolean, default: false },
    InterceptiveTreatment: { type: Boolean, default: false },
    other: { type: String },
  },

  // ✅ Extra details per tooth
  ToothNumber: { type: String },
  Surface: { type: String },
  Quadrant: { type: String },
  Note: { type: String },
});

// 🩺 Main Medical Finding Schema
const MedicalFindingSchema = new mongoose.Schema({
  Recommendation: { type: String },
  
  // ✅ Chief Complaint - selectable options
  ChiefComplaint: {
    None: { type: Boolean, default: false },
    ImproveMySmile: { type: Boolean, default: false },
    CrookedTeeth: { type: Boolean, default: false },
    Crowding: { type: Boolean, default: false },
    Spacing: { type: Boolean, default: false },
    Crown: { type: Boolean, default: false },
    Overbite: { type: Boolean, default: false },
    Underbite: { type: Boolean, default: false },
    Deepbite: { type: Boolean, default: false },
    Crossbite: { type: Boolean, default: false },
    ImpactedTeeth: { type: Boolean, default: false },
    other: { type: String },
  },
  // ✅ Dental History - selectable options
  DentalHistory: {
    None: { type: Boolean, default: false },
    PreviousOrthodonticTreatment: { type: Boolean, default: false },
    MissingTooth: { type: Boolean, default: false },
    UnderSizedTooth: { type: Boolean, default: false },
    Attrition: { type: Boolean, default: false },
    ImpactedTooth: { type: Boolean, default: false },
    other: { type: String },
  },

  PhysicalExamination: { type: String },
  HistoryPresent: { type: String },
  PresentCondition: { type: String },
  DrugAllergy: { type: String },
  Diagnosis: { type: String },
  IntraoralExamination: { type: String },
  ExtraoralExamination: { type: String },
  Investigation: { type: String },
  Assessment: { type: String },
  NextProcedure: { type: String },

  // ✅ Treatment Plan and Treatment Done
  TreatmentPlan: [treatmentCategorySchema],
  TreatmentDone: [treatmentCategorySchema],

  // ✅ Disease tracking
  diseases: [
    {
      disease: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disease',
      },
      diseaseTime: { type: Date, default: Date.now },
    },
  ],

  // ✅ Audit trail
  changeHistory: [
    {
      updatedBy: userReferenceSchema,
      updateTime: { type: Date, default: Date.now },
    },
  ],

  // ✅ Patient & Creator references
  patientId: {
    
      type: mongoose.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],

  },
   branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch", // Make sure this matches your Branch model name exactly
        required: false,
        default: null,
      },
  createdBy: userReferenceSchema,
}, { timestamps: true });

// ✅ Export Model
const MedicalFinding =
  mongoose.models.MedicalFinding ||
  mongoose.model('MedicalFinding', MedicalFindingSchema);

export default MedicalFinding;
