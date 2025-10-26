import mongoose from 'mongoose';

// ======================= ENUMS ======================= //
const HolderStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  RETURNED: 'RETURNED',
  LOST: 'LOST',
    FINISHED: 'FINISHED',

});

// ======================= PersonalStock Schema ======================= //
const PersonalStockSchema = new mongoose.Schema({
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductBatch',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // the person holding this stock
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
  notes: String, // optional field for remarks
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// index for faster lookup per user and batch
PersonalStockSchema.index({ batchId: 1, userId: 1 });

const PersonalStock = mongoose.models.PersonalStock || mongoose.model('PersonalStock', PersonalStockSchema);

export { PersonalStock, HolderStatus };
