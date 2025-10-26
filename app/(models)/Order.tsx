import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";

const OrderSchema = new mongoose.Schema({
  assignedDoctorTo: {
    id: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide user ID'],
    },
    username: {
      type: String,
      required: [true, 'Please provide username'],
    },
  },
  patientId: {
    id: {
      type: mongoose.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
    }
    
  },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch", // Make sure this matches your Branch model name exactly
      required: false,
      default: null,
    },
  createdBy: userReferenceSchema,
  status: {
    type: String,
    required: [true, 'Please provide a status'],
    enum: ['Active', 'Inactive'],
  },
}, 
{
  timestamps: true,
  strictPopulate: false,
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;
