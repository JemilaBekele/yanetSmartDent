import mongoose from 'mongoose';
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const NoteSchema = new mongoose.Schema(
  {
    Note: {
      type: String,
      
    },  
    patientId: {
        type: mongoose.Types.ObjectId,
        ref: "Patient",
        required: [true, "Please provide the Patient ID"],
    },
    createdBy: userReferenceSchema,
    changeHistory: [
      {
        updatedBy: userReferenceSchema,
        updateTime: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Avoid model recompilation during hot reloads
const Note =
  mongoose.models.Note ||
  mongoose.model("Note", NoteSchema);

export default Note;
