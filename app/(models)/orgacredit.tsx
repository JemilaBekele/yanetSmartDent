// models/Service.js
import mongoose from 'mongoose';

const OrgServiceSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
   
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  price: {
    type: Number,
    required: true,
  },
  organizationid:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Orgnazation',
    
  }
}, { timestamps: true });

const OrgService = mongoose.models.OrgService || mongoose.model('OrgService', OrgServiceSchema);

export default OrgService;