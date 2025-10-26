import mongoose from "mongoose";
import userReferenceSchema from "../helpers/userReferenceSchema";



const ConsentSchema = new mongoose.Schema({ 
  allergies: { type: String, required: false }, 
  anemia: { type: Boolean, required: false }, 
  epilepsy: { type: Boolean, required: false }, 
  asthma: { type: Boolean, required: false },
  DiabetesMellitus: { type: Boolean, required: false }, 
  Hypertension: { type: Boolean, required: false }, 
  HeartDisease: { type: Boolean, required: false },
  immuneDeficiency: { type: Boolean, required: false }, 
  coagulopathy: { type: Boolean, required: false }, 
  organopathy: { type: Boolean, required: false },
  pregnancy: { type: Boolean, required: false }, 
  MedicationsTaken: { type: Boolean, required: false }, 
  Asthma: { type: Boolean, required: false },
  Anemia: { type: Boolean, required: false }, 
  Epilepsy: { type: Boolean, required: false },
  other: { type: String, required: false },
  Treatmenttype: { type: String, required: false },
  BleadingDisorder:{type:Boolean, require:false},
       branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch", // Make sure this matches your Branch model name exactly
            required: false,
            default: null,
          },
    patientId: {
        
          type: mongoose.Types.ObjectId,
          ref: "Patient",
          required: [true, "Please provide the Patient ID"],
        
      },
    
  changeHistory: [
    {
      updatedBy: userReferenceSchema, // Reusing your existing userReferenceSchema
      updateTime: { type: Date, default: Date.now }, // Automatically captures the update time
    },
  ],
  createdBy: userReferenceSchema,
  cardNumber: {
    type: Number,
    unique: true,
  },
},{
  timestamps: true,
  strictPopulate: false,
});

ConsentSchema.pre("save", async function (next) {
  if (!this.cardNumber) {
    try {
      const lastConsent = await mongoose
        .model("Consent")
        .findOne({}, { cardNumber: 1 })
        .sort({ cardNumber: -1 }); // Get the highest card number

      this.cardNumber = lastConsent ? lastConsent.cardNumber + 1 : 200000; // Start from 200000
    } catch (error) {
      return next(error);
    }
  }
  next();
});
// Create and export the Credit model
const Consent = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);
export default Consent;
