import mongoose from "mongoose";

// Define the UserReference type based on your userReferenceSchema
export interface UserReference {
  id: mongoose.Types.ObjectId;
  username: string; // Add any additional fields if necessary
}

// Define the CustomerName type based on the customerName structure
export interface CustomerName {
  id: mongoose.Types.ObjectId;
  username: string;
  cardno: string;
}

// Define the Invoice structure based on the Invoice schema
export interface Invoice {
  id: mongoose.Types.ObjectId;
  amount: number;
  customerName: CustomerName;
  created: CustomerName;
}

// Define the History item interface
export interface HistoryItem {
  _id: mongoose.Types.ObjectId; // MongoDB ID for the History record
  Invoice: Invoice;
  createdBy: UserReference;
  createdAt: Date; // Automatically managed by mongoose timestamps
  updatedAt: Date; // Automatically managed by mongoose timestamps
}

// Define the History model interface (if needed)
export interface HistoryModel extends mongoose.Document {
  Invoice: Invoice;
  createdBy: UserReference;
  createdAt: Date;
  updatedAt: Date;
}
