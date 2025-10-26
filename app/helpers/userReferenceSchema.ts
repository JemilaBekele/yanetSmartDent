// models/userReferenceSchema.ts
import mongoose from "mongoose";

const userReferenceSchema = new mongoose.Schema({
  id: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user'],
  },
  username: {
    type: String,
    required: [true, 'Please provide sender name'],
  },
}, { _id: false });

export default userReferenceSchema;

