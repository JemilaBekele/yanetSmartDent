import mongoose from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const HealthinfoSchema = new mongoose.Schema({
  bloodgroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''], // Allow null as a valid value
    default: '', // Default to null when not provided
  },
  weight: {
    type: String,
    default: null, // Optional field
  },
  height: {
    type: String,
    default: null, // Optional field
  },
  allergies: {
    type: String,
    default: null, // Optional field
  },
  habits: {
    type: String,
    default: null, // Optional field
  },
  Medication: {
    type: String,
    default: null, // Optional field
  },
  Core_Temperature: { type: String, default: "" },
  Respiratory_Rate: { type: String, default: "" },
  Blood_Oxygen: { type: String, default: "" },
  Blood_Pressure: { type: String, default: "" },
  heart_Rate: { type: String, default: "" },
  Hypertension: { type: String, default: "" },
  Hypotension: { type: String, default: "" },
  Tuberculosis: { type: String, default: "" },
  Astema: { type: String, default: "" },
  description:{type:String,default:""},
  Hepatitis: { type: String, default: "" },
  Diabetics: { type: String, default: "" },
  BleedingTendency:{type:String,default:""},
  Epilepsy: { type: String, default: "" },
  userinfo: [
    {   BloodPressure:  { type: Boolean ,  default: false},
    Hypotension:  { type: Boolean,  default: false },
    Diabetics:  { type: Boolean, default: false },
    BleedingTendency :  { type: Boolean, default: false },
    Tuberculosis:  { type: Boolean, default: false },
    Epilepsy:  { type: Boolean, default: false },
    Hepatitis:  { type: Boolean, default: false},
    Allergies:  { type: Boolean, default: false},
    Asthma:  { type: Boolean, default: false },
    IfAnydrugstaking:  { type: Boolean, default: false },
    Pregnancy:  { type: Boolean, default: false},
    IfanyotherDiseases:  { type: String, required: false },
    
    Kidney: { type: Boolean, default: false }, // ኩላሊት 
    Hormone: { type: Boolean, default: false }, // ሆርሞን 
    ProstheticLimb: { type: Boolean, default: false }, // ሰው ሰራሽ አካል 
    KnownMedicalCondition: { type: Boolean, default: false }, // የሚታወቅ የሜዲካል በሽታ 
    MajorSurgery: { type: Boolean, default: false }, // ከባድ ቀዶ ጥገና
   
    },
  ],
   branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch", // Make sure this matches your Branch model name exactly
        required: false,
        default: null,
      },
  patientId: {
  
      type: mongoose.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
   
  },
   
  changeHistory: [
    {
      updatedBy: userReferenceSchema,
      updateTime: { type: Date, default: Date.now },
    },
  ],
  createdBy: userReferenceSchema,
}, { timestamps: true });

// Avoid model recompilation during hot reloads
const Healthinfo = mongoose.models.Healthinfo || mongoose.model('Healthinfo', HealthinfoSchema);

export default Healthinfo;
