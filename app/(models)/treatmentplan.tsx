import mongoose from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";
const TreatmentPlanSchema = new mongoose.Schema(
  {
    patientId: {
     type: mongoose.Types.ObjectId,
         ref: 'Patient',
         required: [true, 'Please provide Patient ID'], 
     },
    services: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
          required: true,
        },
        description: {
          type: String, // Description of why the service is chosen
          required: true,
        },
      },
    ],
    totalCost: {
      type: Number, // Automatically calculated as the sum of all service prices
      required: true,
    },
  createdBy: userReferenceSchema,
  },
  { timestamps: true }
);

const TreatmentPlan =
  mongoose.models.TreatmentPlan || mongoose.model('TreatmentPlan', TreatmentPlanSchema);

export default TreatmentPlan;
