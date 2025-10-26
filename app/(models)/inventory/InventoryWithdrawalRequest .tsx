import mongoose from 'mongoose';

// ======================= ENUMS ======================= //
const WithdrawalStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  ISSUED: 'ISSUED',   // when stock is actually given to the person
  RETURNED: 'RETURNED', // when returned
});

// ======================= Withdrawal Item Schema ======================= //
const WithdrawalItemSchema = new mongoose.Schema({
     productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBatch', // which product batch they want
    required: true,
  },
  productUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductUnit', // unit of measurement (e.g., pcs, box, kg)
    required: true,
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  personalStockId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalStock', // link created when items are issued
  },
}, { _id: false });

// ======================= Withdrawal Request Schema ======================= //
const InventoryWithdrawalRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // who is requesting
    required: true,
  },
  items: {
    type: [WithdrawalItemSchema], // allow multiple items
    validate: [arr => arr.length > 0, 'At least one item is required'],
  },
  status: {
    type: String,
    enum: Object.values(WithdrawalStatus),
    default: WithdrawalStatus.PENDING,
  },
  notes: String, // remarks (e.g., reason for withdrawal, purpose)
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: Date,
  issuedAt: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// index for faster query
InventoryWithdrawalRequestSchema.index({ userId: 1, status: 1 });

const InventoryWithdrawalRequest =
  mongoose.models.InventoryWithdrawalRequest ||
  mongoose.model('InventoryWithdrawalRequest', InventoryWithdrawalRequestSchema);

export { InventoryWithdrawalRequest, WithdrawalStatus };
