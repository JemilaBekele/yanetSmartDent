import mongoose from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const ImageSchema = new mongoose.Schema({
    image: {
        type: String,
        required: false, // Optional: set to true if you want to require an image
        default: null, // Default value if no image is provided
      },
   
  patientId: {
    id: {
      type: mongoose.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
    }
  },
  createdBy: userReferenceSchema,
}, { timestamps: true });

// Avoid model recompilation during hot reloads
const Image = mongoose.models.Image || mongoose.model('Image', ImageSchema);

export default Image;

