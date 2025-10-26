import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";


const DiseaseSchema = new mongoose.Schema({
 
    disease: {
    type: String,
    required: [true, 'Please provide a Disease'],
  },

  createdBy: userReferenceSchema,

}, 
{
  timestamps: true,
  strictPopulate: false,
});

const Disease = mongoose.models.Disease || mongoose.model('Disease', DiseaseSchema);

export default Disease;