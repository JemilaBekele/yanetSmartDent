import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

// =============================
// 🦷 TOOTH CONDITION MAPPING
// =============================
export const TOOTH_CONDITIONS = {
  CARIES: { label: "Caries Lesions", colorCode: "#FF0000" },
  SILVER_AMALGAM: { label: "Silver Amalgam Filling", colorCode: "#808080" },
  COMPOSITE_FILLING: { label: "Composite Filling", colorCode: "#0000FF" },
  CROWN_MISSING: { label: "Crown Missing", colorCode: "#A0522D" },
  CROWN: { label: "Crown (tooth or with crown)", colorCode: "#FFD700" },
  NEED_ROOT_CANAL: { label: "Need Root Canal Treatment", colorCode: "#FF1493" },
  RCT_TREATED: { label: "R.C. Treated Tooth", colorCode: "#0000FF" },
  POOR_RCT: { label: "Poor R.C.T Tooth", colorCode: "#FF0000" },
  PROSTHETIC_CROWN: { label: "Prosthetic Crown", colorCode: "#FFD790" },

};

// Root canal conditions mapping
export const ROOT_CANAL_CONDITIONS = {
  NORMAL: { label: "Normal", colorCode: "transparent" },
  NEED_ROOT_CANAL: { label: "Need Root Canal", colorCode: "#FF1493" },
  RCT_TREATED: { label: "R.C. Treated", colorCode: "#0000FF" },
  POOR_RCT: { label: "Poor R.C.T", colorCode: "#FF0000" },
  CROWN: { label: "Crown (tooth or with crown)", colorCode: "#FFD700" },
  PROSTHETIC_CROWN: { label: "Prosthetic Crown", colorCode: "#FFD790" },


};

// =============================
// 🦷 SURFACE SCHEMA (Updated for frontend compatibility)
// =============================
const surfaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["Mesial", "Distal", "Occlusal", "Buccal", "Lingual"],
      required: true,
    },
    condition: {  // Changed from 'conditions' array to single 'condition'
      type: String,
      enum: Object.keys(TOOTH_CONDITIONS),
    },
    color: {
      type: String,
      match: /^#(?:[0-9a-fA-F]{3}){1,2}$|^transparent$/,
      default: null,
    },
  },
  { _id: false }
);

// =============================
// 🦷 ROOT LAYER SCHEMA (Enhanced for SVG painter compatibility)
// =============================
// Update the rootLayerSchema to make position not required for custom paintings
// In your dental chart schema, update the rootLayerSchema:

const rootLayerSchema = new mongoose.Schema(
  {
    position: {
      type: String,
      required: false,
      enum: ["FULL", "BUCCAL", "LINGUAL", "MESIOBUCCAL", "DISTOBUCCAL", "MESIAL", "DISTAL", "CUSTOM"],
      default: "CUSTOM"
    },
    condition: {
      type: String,
      enum: Object.keys(ROOT_CANAL_CONDITIONS),
      required: true,
      default: "NORMAL"
    },
    color: {
      type: String,
      match: /^#(?:[0-9a-fA-F]{3}){1,2}$|^transparent$/,
      required: true,
      default: "transparent"
    },
    isCustomPainting: {
      type: Boolean,
      default: true,
    },
    brushSize: {
      type: Number,
      default: 8,
    },
    svgData: {
      type: String, // Store SVG path data as string
      default: null,
    },
    coordinates: [{
      x: Number,
      y: Number,
      timestamp: Date,
    }],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);
// =============================
// 🦷 CUSTOM ROOT LAYERS SCHEMA (For SVG painter data)
// =============================
const customRootLayerSchema = new mongoose.Schema(
  {
    toothNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 32,
    },
    layers: [rootLayerSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// =============================
// 🦷 TOOTH SCHEMA (Updated for frontend compatibility)
// =============================
const toothSchema = new mongoose.Schema(
  {
    toothNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 32,
    },
     overallStatus: {
      type: String,
      enum: [
        "NORMAL",
        "MISSING_TOOTH",
        "CROWN_MISSING",
        "NEED_EXTRACTION",
      ],
      default: "NORMAL",
    },
    surfaces: [surfaceSchema],
    roots: [rootLayerSchema], // Using the same rootLayerSchema for consistency
    // Notes fields for both surface and root canal charts
    notes: {
      type: String,
      maxlength: 500,
      default: "",
    },
    generalNote: { // For surface chart compatibility
      type: String,
      maxlength: 500,
      default: "",
    },
    // Metadata
    lastModified: {
      type: Date,
      default: Date.now,
    },
    modifiedBy: userReferenceSchema,
  },
  { _id: false }
);

// =============================
// 🦷 DENTAL CHART SCHEMA (Enhanced for full frontend support)
// =============================
const dentalChartSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
       isChild: {
      type: Boolean,
      default: false,
    },
    // Main teeth data - supports both surface and root canal charts
    teeth: {
      type: [toothSchema],
      validate: [
        (v) => v.length <= 32,
        "A dental chart cannot have more than 32 teeth.",
      ],
      default: [],
    },
    // Custom root layers from SVG painter
    customRootLayers: {
      type: [customRootLayerSchema],
      default: [],
    },
    // Chart metadata
    activeTab: {
      type: String,
      enum: ["surface", "rootCanal"],
      default: "surface",
    },
    // Selection state
    selectedTooth: {
      type: Number,
      min: 1,
      max: 32,
      default: null,
    },
    selectedCondition: {
      type: String,
      enum: Object.keys(TOOTH_CONDITIONS),
      default: "NEED_EXTRACTION",
    },
    selectedRootCanalCondition: {
      type: String,
      enum: Object.keys(ROOT_CANAL_CONDITIONS),
      default: "NORMAL",
    },
    // Brush settings for SVG painter
    brushSettings: {
      brushSize: {
        type: Number,
        default: 8,
        min: 1,
        max: 50,
      },
      selectedColor: {
        type: String,
        match: /^#(?:[0-9a-fA-F]{3}){1,2}$/,
        default: "#FF1493", // NEED_ROOT_CANAL color
      },
    },
    createdBy: userReferenceSchema,
    // Enhanced change history
    changeHistory: [
      {
        updatedBy: userReferenceSchema,
        updateTime: { 
          type: Date, 
          default: Date.now 
        },
        changeType: {
          type: String,
          enum: ["SURFACE_UPDATE", "ROOT_UPDATE", "CUSTOM_PAINTING", "NOTE_UPDATE", "STATUS_CHANGE"],
        },
        toothNumber: Number,
        details: mongoose.Schema.Types.Mixed,
        reason: { 
          type: String,
          maxlength: 200 
        },
      },
    ],
    // Versioning for conflict resolution
    version: {
      type: Number,
      default: 1,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// =============================
// 🦷 VIRTUAL FIELDS & METHODS
// =============================

// Virtual for getting all teeth with custom layers merged
dentalChartSchema.virtual('teethWithCustomLayers').get(function() {
  const teethMap = new Map();
  
  // Add all regular teeth
  this.teeth.forEach(tooth => {
    teethMap.set(tooth.toothNumber, {
      ...tooth.toJSON(),
      customRootLayers: []
    });
  });
  
  // Merge custom root layers
  this.customRootLayers.forEach(customTooth => {
    if (teethMap.has(customTooth.toothNumber)) {
      const tooth = teethMap.get(customTooth.toothNumber);
      tooth.customRootLayers = customTooth.layers;
    } else {
      // Create a new tooth entry if it doesn't exist
      teethMap.set(customTooth.toothNumber, {
        toothNumber: customTooth.toothNumber,
        overallStatus: "NORMAL",
        surfaces: [],
        roots: [],
        notes: "",
        generalNote: "",
        customRootLayers: customTooth.layers
      });
    }
  });
  
  return Array.from(teethMap.values());
});

// Method to get all root layers for a tooth (both regular and custom)
dentalChartSchema.methods.getAllRootLayers = function(toothNumber) {
  const tooth = this.teeth.find(t => t.toothNumber === toothNumber);
  const customTooth = this.customRootLayers.find(ct => ct.toothNumber === toothNumber);
  
  const regularLayers = tooth ? tooth.roots : [];
  const customLayers = customTooth ? customTooth.layers : [];
  
  return [...regularLayers, ...customLayers];
};

// Method to get surface conditions for a tooth
dentalChartSchema.methods.getSurfaceConditions = function(toothNumber) {
  const tooth = this.teeth.find(t => t.toothNumber === toothNumber);
  if (!tooth) return {};
  
  const conditions = {};
  tooth.surfaces.forEach(surface => {
    conditions[surface.name] = {
      condition: surface.condition,
      color: surface.color
    };
  });
  
  return conditions;
};

// Method to add a change history entry
dentalChartSchema.methods.addChangeHistory = function(entry) {
  this.changeHistory.push({
    ...entry,
    updateTime: new Date()
  });
  
  // Keep only last 100 changes
  if (this.changeHistory.length > 100) {
    this.changeHistory = this.changeHistory.slice(-100);
  }
  
  this.version += 1;
};

// =============================
// 🦷 INDEXES
// =============================
dentalChartSchema.index({ patient: 1 });
dentalChartSchema.index({ "teeth.toothNumber": 1 });
dentalChartSchema.index({ "customRootLayers.toothNumber": 1 });
dentalChartSchema.index({ createdAt: -1 });
dentalChartSchema.index({ version: 1 });

// =============================
// 🦷 PRE-SAVE MIDDLEWARE
// =============================
dentalChartSchema.pre('save', function(next) {
  // Update lastModified for all teeth
  this.teeth.forEach(tooth => {
    tooth.lastModified = new Date();
  });
  
  // Update lastUpdated for custom root layers
  this.customRootLayers.forEach(customTooth => {
    customTooth.lastUpdated = new Date();
  });
  
  next();
});

// =============================
// 🦷 STATIC METHODS
// =============================
dentalChartSchema.statics.findByPatient = function(patientId) {
  return this.findOne({ patient: patientId }).sort({ createdAt: -1 });
};

dentalChartSchema.statics.findByToothNumber = function(patientId, toothNumber) {
  return this.findOne({
    patient: patientId,
    $or: [
      { "teeth.toothNumber": toothNumber },
      { "customRootLayers.toothNumber": toothNumber }
    ]
  });
};

// =============================
// 🦷 MODEL EXPORT
// =============================
const DentalChart =
  mongoose.models.DentalChart ||
  mongoose.model("DentalChart", dentalChartSchema);

export default DentalChart;