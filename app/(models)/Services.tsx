// models/Service.js
import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
    unique: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  price: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

export default Service;