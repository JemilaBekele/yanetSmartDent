import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";
import { boolean } from "zod";

const HistorySchema = new mongoose.Schema({
  Invoice: {
    id: {
      type: mongoose.Types.ObjectId,
      ref: 'Invoice',
    },
    
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Amount must be an integer',
      },
    },
    receipt: {
      type: Boolean,
      default: true,
    },  
      customerName: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Patient', // Reference to Patient model
          required: [true, 'Please provide Patient ID'],
        },
        username: {
          type: String,
          required: [true, 'Please provide Patient name'],
        },
        cardno: {
          type: String,
          required: [true, 'Please provide Patient card number'],
        },
      },
      advance:{
         type: Boolean,
      default: false,
      },
      created: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Patient', // Reference to Patient model
          required: [true, 'Please provide Patient ID'],
        },
        username: {
          type: String,
          required: [true, 'Please provide Patient name'],
        },
       
      },
  },
  
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch", // Make sure this matches your Branch model name exactly
      required: false,
      default: null,
    },
  createdBy: userReferenceSchema,  
}, 
{
  timestamps: true,
  strictPopulate: false,
});

const History = mongoose.models.History || mongoose.model('History', HistorySchema);

export default History;