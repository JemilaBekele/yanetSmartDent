// app/(models)/Branch.js
import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a branch name"],
    unique: true,
    trim: true,
  },
  location: {
    type: String,
    required: false,
    default: null,
  },
  phone: {
    type: String,
    required: false,
    default: null,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // optionally link to a user who manages the branch
    required: false,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
    // 🏢 New field: branch

});

const Branch = mongoose.models.Branch || mongoose.model("Branch", branchSchema);
export default Branch;
