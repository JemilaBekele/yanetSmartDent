import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const DentalLabFormSchema = new mongoose.Schema(
  {
    // ========== Patient & Case Info ==========
    patient: {
      type: mongoose.Types.ObjectId,
      ref: "Patient",
      required: [true, "Please provide Patient ID"],
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch", // Make sure this matches your Branch model name exactly
        required: false,
        default: null,
      },

    deliveryDate: { type: Date },

      toothNumbers: [{ type: String }], // ex: ["12"]
      toothNumberTwo: [{ type: String }],
    // ========== Restoration Info ==========
    restoration: {
      // === Type checkboxes ===
      
        jointCrown: { type: Boolean, default: false },
        separateCrown: { type: Boolean, default: false },
        bridge: { type: Boolean, default: false },
        other: { type: Boolean, default: false },
    

      
    },
enclosedWith: {

        // === Enclosed With type checkboxes ===
        
          impUpper: { type: Boolean, default: false },
          impLower: { type: Boolean, default: false },
          vite: { type: Boolean, default: false },
          modelUpper: { type: Boolean, default: false },
          modelLower: { type: Boolean, default: false },
          bite: { type: Boolean, default: false },
          other: { type: Boolean, default: false },
      

        // === Material checkboxes ===
       
      },
       material: {
          pfm: { type: Boolean, default: false },
          pfmFacing: { type: Boolean, default: false },
          fullMetal: { type: Boolean, default: false },
          tiliteFacing: { type: Boolean, default: false },
          tilite: { type: Boolean, default: false },
          tiliteFullMetal: { type: Boolean, default: false },
          tiliteInlayOnlay: { type: Boolean, default: false },
          ywPFM: { type: Boolean, default: false },
          ywFacing: { type: Boolean, default: false },
          ywFullMetal: { type: Boolean, default: false },
          bruxzirCrown: { type: Boolean, default: false },
          bruxzirBridge: { type: Boolean, default: false },
          bruxzirInlayOnlay: { type: Boolean, default: false },
          ywUltraTCrown: { type: Boolean, default: false },
          ywUltraTBridge: { type: Boolean, default: false },
          ywZirconCrown: { type: Boolean, default: false },
          ywZirconBridge: { type: Boolean, default: false },
          lavaPremium: { type: Boolean, default: false },
          lavaClassic: { type: Boolean, default: false },
          lavaEssential: { type: Boolean, default: false },
          ipsEmaxSingleCrown: { type: Boolean, default: false },
          ipsEmaxLaminate: { type: Boolean, default: false },
          ipsEmaxInlayOnlay: { type: Boolean, default: false },
          ipsEmpressSingleCrown: { type: Boolean, default: false },
          ipsEmpressLaminate: { type: Boolean, default: false },
          ipsEmpressInlayOnlay: { type: Boolean, default: false },
          mockup: { type: Boolean, default: false },
          provisional: { type: Boolean, default: false },
        },
    // ========== Shade ==========
    shade: {
      code: { type: String }, // e.g. A3 Ultra Classic
      diagram: { type: String }, // could be stored as base64 image or reference
    },

    // ========== Margin ==========
    margin: {
      shoulderMargin: { type: Boolean, default: false },
      gingivalMargin: { type: Boolean, default: false },
      none: { type: Boolean, default: false },
    },

    // ========== Occlusal Staining ==========
    occlusalStaining: {
      none: { type: Boolean, default: false },
      light: { type: Boolean, default: false },
      medium: { type: Boolean, default: false },
      dark: { type: Boolean, default: false },
    },

    // ========== Occlusal Clearance ==========
    occlusalClearance: {
      callDoctor: { type: Boolean, default: false },
      markOpposing: { type: Boolean, default: false },
      metalIsland: { type: Boolean, default: false },
    },

    // ========== Stage ==========
    stage: {
      metalTryIn: { type: Boolean, default: false },
      copingTryIn: { type: Boolean, default: false },
      bisqueTryIn: { type: Boolean, default: false },
      finish: { type: Boolean, default: false },
    },

    // ========== Pontic Design ==========
    ponticDesign: {
      modifiedRidge: { type: Boolean, default: false },
      fullRidge: { type: Boolean, default: false },
      hygienic: { type: Boolean, default: false },
      ovate: { type: Boolean, default: false },
    },

    // ========== Collar & Metal Design ==========
    collarDesign: {
      noCollar: { type: Boolean, default: false },
      lingualCollar: { type: Boolean, default: false },
      collar360: { type: Boolean, default: false },
    },

    // ========== Notes & Specs ==========
    specifications: { type: String },
        finish: {
      type: Boolean,
      default: false,
    },
    labnotes: { type: String },
    modelacceptance: {  type: Boolean,
      default: false,},
    delivered: {
      type: Boolean,
      default: false,
    },
    deliveredby: {
      type: String,
    },
    notes: { type: String },
    
 changeHistory: [
    {
      updatedBy: userReferenceSchema,
      updateTime: { type: Date, default: Date.now },
    },
  ],
    // ========== Meta ==========
    createdBy: userReferenceSchema,
  },
  { timestamps: true, strictPopulate: false }
);

const DentalLabForm =
  mongoose.models.DentalLabForm ||
  mongoose.model("DentalLabForm", DentalLabFormSchema);

export default DentalLabForm;
