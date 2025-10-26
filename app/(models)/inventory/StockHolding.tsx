import mongoose from 'mongoose';

// ======================= ENUMS ======================= //
const HolderStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED',
  LOST: 'LOST',
});

// ======================= StockHoldingItem Schema ======================= //
const StockHoldingItemSchema = new mongoose.Schema({
  requestItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryRequestItem', // link to the specific item requested
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBatch',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductUnit',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(HolderStatus),
    default: HolderStatus.ACTIVE,
  },
  notes: String,
}, { _id: false });

// ======================= StockHolding Schema ======================= //
const StockHoldingSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryRequest', // link to the request that generated this holding
    required: true,
  },
  holderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // person (doctor/nurse/etc.) holding the stock
    required: true,
  },
  issuedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // the person who approved/released the stock
  },
  items: {
    type: [StockHoldingItemSchema],
    validate: v => Array.isArray(v) && v.length > 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// ======================= Index ======================= //
StockHoldingSchema.index({ holderId: 1, requestId: 1 });

// ======================= Model ======================= //
const StockHolding = mongoose.models.StockHolding || mongoose.model('StockHolding', StockHoldingSchema);

export { StockHolding, HolderStatus };
