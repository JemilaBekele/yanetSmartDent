import mongoose from 'mongoose';

const ProCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});


// Virtuals (relations)
// Virtuals
ProCategorySchema.virtual('subCategories', {
  ref: 'SubCategory',
  localField: '_id',
  foreignField: 'categoryId',   // 👈 match SubCategory field
});

ProCategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
});

// SubCategorySchema.virtual('products', {
//   ref: 'Product',
//   localField: '_id',
//   foreignField: 'subCategoryId',
// });

const ProCategory = mongoose.models.ProCategory || mongoose.model('ProCategory', ProCategorySchema);

export default ProCategory ;
