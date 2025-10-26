import mongoose from 'mongoose';



// SubCategory Schema
const SubCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  procategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProCategory', // relation to Category
    required: true,
  },
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

SubCategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'subCategoryId',
});



const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', SubCategorySchema);

export default  SubCategory ;
