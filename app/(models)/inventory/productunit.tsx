import mongoose from 'mongoose';

const ProductUnitSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  unitOfMeasureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UnitOfMeasure',
    required: true,
  },
  conversionToBase: {
    type: Number,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});

// ✅ Unique constraint on (productId, unitOfMeasureId)
ProductUnitSchema.index({ productId: 1, unitOfMeasureId: 1 }, { unique: true });



// 👉 ProductUnit → PurchaseItems
ProductUnitSchema.virtual('purchaseItems', {
  ref: 'PurchaseItem',
  localField: '_id',
  foreignField: 'productUnitId',
});

// 👉 ProductUnit → StockLedgers
ProductUnitSchema.virtual('stockLedgers', {
  ref: 'StockLedger',
  localField: '_id',
  foreignField: 'productUnitId',
});

const ProductUnit = mongoose.models.ProductUnit || mongoose.model('ProductUnit', ProductUnitSchema);

export default ProductUnit;
