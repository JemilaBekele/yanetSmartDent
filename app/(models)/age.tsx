import mongoose from "mongoose";


const AgeSchema = new mongoose.Schema({
  patient: {
   
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
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

const Age = mongoose.models.Age || mongoose.model('Age', AgeSchema);

export default Age;