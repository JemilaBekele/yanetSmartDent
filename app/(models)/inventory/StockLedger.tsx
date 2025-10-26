import mongoose from 'mongoose';

// ======================= ENUMS ======================= //
const StockType = Object.freeze({
  MAIN: 'MAIN',
  PERSONAL: 'PERSONAL',
  Location: 'Location',
});

const StockLedgerSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', // relation to Product
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBatch',
  },
  stockType: {
    type: String,
    enum: Object.values(StockType),
    default: StockType.MAIN,
    required: true,
  },
  movementType: {
    type: String,
    enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  productUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductUnit',
    required: true,
  },
  reference: {
    type: String,
    trim: true,
  },
  movementDate: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.stockType === StockType.PERSONAL; // user required only for personal stock
    },
  },
  notes: {
    type: String,
    trim: true,
  },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

const StockLedger = mongoose.models.StockLedger || mongoose.model('StockLedger', StockLedgerSchema);

export default StockLedger;
