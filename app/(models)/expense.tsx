import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const ExpenseSchema = new mongoose.Schema({
  discription: {
    type: String,
    required: true,
  },   
  
  amount: {
    type: Number,
    required: true,
  },

  createdBy: userReferenceSchema,
  
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: false,
    default: null,
  },

}, {
  timestamps: true,
  // Remove strictPopulate: false as it's not recommended for production
});

// Add virtuals or methods if needed
ExpenseSchema.virtual('branchInfo').get(function() {
  return this.branch;
});

// Ensure virtuals are included when converting to JSON
ExpenseSchema.set('toJSON', { virtuals: true });
ExpenseSchema.set('toObject', { virtuals: true });

const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

export default Expense;