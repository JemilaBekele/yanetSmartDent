import mongoose from 'mongoose';
import ProductBatch from './ProductBatch'; // 👈 ensure this is imported so the model is registered
import ProCategory from './Category';   // 👈 ensure it's imported
import SubCategory from './SubCategory';  
// ================= Product Schema =================
const ProductSchema = new mongoose.Schema({
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProCategory',
    required: true, // every product belongs to a category
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: false, // optional, if product belongs to a subcategory
  },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
}, { 
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } 
});



ProductSchema.virtual('batches', {
  ref: 'ProductBatch',
  localField: '_id',
  foreignField: 'productId',
});

ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ subCategoryId: 1 });
ProductSchema.index({ createdById: 1 });


// 👉 SubCategory → Products

// ================= Models =================
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

export default Product;
