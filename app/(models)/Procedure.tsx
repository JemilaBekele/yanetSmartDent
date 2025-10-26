import mongoose from "mongoose";

// ================= Procedure Model ================= //
const ProcedureSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Please provide a procedure title"] },
    description: { type: String },
  },
  { timestamps: true }
);

const Procedure =
  mongoose.models.Procedure || mongoose.model("Procedure", ProcedureSchema);

export default Procedure;
