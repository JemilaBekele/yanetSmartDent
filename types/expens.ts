import mongoose from "mongoose";
export interface UserReference {
    id: mongoose.Types.ObjectId;
    username: string; // Add any additional fields if necessary
  }
export interface Item {
    quantity: number;
    amount: number;
    _id: mongoose.Types.ObjectId; // MongoDB ID for the History record
    
    createdBy: UserReference;
    createdAt: Date; // Automatically managed by mongoose timestamps
    updatedAt: Date; // Automatically managed by mongoose timestamps
  }
