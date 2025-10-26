import mongoose from 'mongoose';

const StockSchema = new mongoose.Schema({
  batchId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'ProductBatch',
     required: true,
   },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // relation to user
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Reserved', 'Sold', 'Damaged', 'Returned'],
    default: 'Available',
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// index for faster lookup
StockSchema.index({ batchId: 1 });

const Stock = mongoose.models.Stock || mongoose.model('Stock', StockSchema);

export default Stock;
