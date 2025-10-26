import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const OrgnazationSchema = new mongoose.Schema({
  patient: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
    }
  }],
  organization: {
    type: String,
    required: [true, 'Please provide an organization name'],
  },
    
  createdBy: userReferenceSchema,

}, {
  timestamps: true,
  strictPopulate: false,
});

const Orgnazation = mongoose.models.Orgnazation || mongoose.model('Orgnazation', OrgnazationSchema);

export default Orgnazation;
