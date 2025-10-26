import mongoose from 'mongoose';

// ======================= ENUMS ======================= //
const ApprovalStatus = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

// ======================= InventoryRequestItem Schema ======================= //
const InventoryRequestItemSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryRequest',
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
  },
  productUnitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductUnit',
    required: true,
  },
  requestedQuantity: {
    type: Number,
    required: true,
  },
  approvedQuantity: {
    type: Number,
    default: 0,
  },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// ======================= InventoryRequest Schema ======================= //
const InventoryRequestSchema = new mongoose.Schema({
  requestNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  requestedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  totalRequestedQuantity: {
    type: Number,
    default: 0,
  },
  totalApprovedQuantity: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
  },
  requestDate: {
    type: Date,
    default: Date.now,
  },
  approvedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Auto-generate requestNo with prefix
InventoryRequestSchema.pre('save', async function (next) {
  if (!this.requestNo) {
    const last = await mongoose.model('InventoryRequest').findOne({}, { requestNo: 1 }).sort({ requestNo: -1 });
    const num = last ? Number(last.requestNo.replace(/^REQ-/, '')) + 1 : 100000;
    this.requestNo = `REQ-${num}`;
  }
  next();
});


// ======================= Virtual Relations ======================= //
InventoryRequestSchema.virtual('items', {
  ref: 'InventoryRequestItem',
  localField: '_id',
  foreignField: 'requestId',
});

// ======================= Models ======================= //
const InventoryRequest = mongoose.models.InventoryRequest || mongoose.model('InventoryRequest', InventoryRequestSchema);
const InventoryRequestItem = mongoose.models.InventoryRequestItem || mongoose.model('InventoryRequestItem', InventoryRequestItemSchema);

export { InventoryRequest, InventoryRequestItem, ApprovalStatus };
