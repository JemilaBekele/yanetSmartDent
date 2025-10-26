import mongoose from 'mongoose';

// ProductBatch Schema
const ProductBatchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  expiryDate: {
    type: Date,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // relation to Product
    required: true,
  },
   manufactureDate: {   // 👈 product age/manufacture date
    type: Date,
  },
  size: {              // 👈 size of the product batch (e.g., 100ml, 500mg, 1kg)
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    default: 0,
  },
  warningQuantity: {
    type: Number,
    default: 0,
  },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});



const ProductBatch = mongoose.models.ProductBatch || mongoose.model('ProductBatch', ProductBatchSchema);

export default  ProductBatch ;
