import mongoose from 'mongoose';

// ======================= ENUMS =======================
const ApprovalStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// ======================= PurchaseItem Schema ======================= //
const PurchaseItemSchema = new mongoose.Schema({
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBatch',
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
  unitPrice: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// ======================= Purchase Schema =======================
const PurchaseSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true,
  },
  approvalStatus: {
    type: String,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.PENDING,
  },
  totalProducts: {
    type: Number,
    default: 0,
  },
  totalQuantity: {
    type: Number,
    default: 0,
  },
  Total: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// ======================= Virtual Relations =======================

// Purchase → PurchaseItems
PurchaseSchema.virtual('items', {
  ref: 'PurchaseItem',
  localField: '_id',
  foreignField: 'purchaseId',
});

// Purchase → Payments
PurchaseSchema.virtual('payments', {
  ref: 'PurchasePayment',
  localField: '_id',
  foreignField: 'purchaseId',
});


// ======================= Models =======================
const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', PurchaseSchema);
const PurchaseItem = mongoose.models.PurchaseItem || mongoose.model('PurchaseItem', PurchaseItemSchema);

export { Purchase, PurchaseItem, ApprovalStatus };
