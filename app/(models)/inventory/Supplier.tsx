import mongoose from 'mongoose';

const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactName: {
    type: String,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  address: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  tinNumber: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
  },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// If you want to reference purchases, add relation like this:
SupplierSchema.virtual('purchases', {
  ref: 'Purchase',
  localField: '_id',
  foreignField: 'supplierId',
});

const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);

export default Supplier;
