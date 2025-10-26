import mongoose from "mongoose";
import userReferenceSchema from "@/app/helpers/userReferenceSchema";


const CardSchema = new mongoose.Schema({
  patient: {
    id: {
      type: mongoose.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Please provide Patient ID'],
    },
  username: {
        type: String,
        required: [true, 'Please provide Patient name'],
      },
  
  },
  cardprice: {
    type: Number,
    required: true,
    default: 100, // Calculated based on items
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

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

export default Card;