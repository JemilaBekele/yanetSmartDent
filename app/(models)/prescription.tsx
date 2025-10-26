import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const PrescriptionSchema = new mongoose.Schema(
  {
    description: {
      type: String,
    },
    diagnosis: {
      type: String,
    },
    Name: {
      type: String,
    },
     branch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Branch", // Make sure this matches your Branch model name exactly
          required: false,
          default: null,
        },
    patientId: {
      
        type: mongoose.Types.ObjectId,
        ref: "Patient",
        required: [true, "Please provide Patient ID"],
      
    },
    createdBy: userReferenceSchema,
    changeHistory: [
      {
        updatedBy: userReferenceSchema, // Reusing your existing userReferenceSchema
        updateTime: { type: Date, default: Date.now }, // Automatically captures the update time
      },
    ],
    // Auto-incrementing card number
    cardNumber: {
      type: Number,
      unique: true,
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate an incremented card number
PrescriptionSchema.pre("save", async function (next) {
  if (!this.cardNumber) {
    try {
      const lastPrescription = await mongoose
        .model("Prescription")
        .findOne({}, { cardNumber: 1 })
        .sort({ cardNumber: -1 }); // Get the highest card number

      this.cardNumber = lastPrescription ? lastPrescription.cardNumber + 1 : 100000; // Start from 100000
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Avoid model recompilation during hot reloads
const Prescription =
  mongoose.models.Prescription ||
  mongoose.model("Prescription", PrescriptionSchema);

export default Prescription;
