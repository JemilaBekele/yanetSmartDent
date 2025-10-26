import mongoose from 'mongoose';

const UnitOfMeasureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,  // matches @unique in Prisma
    trim: true,
  },
  symbol: {
    type: String,
    trim: true,
  },
}, { 
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } 
});

const UnitOfMeasure = mongoose.models.UnitOfMeasure || mongoose.model('UnitOfMeasure', UnitOfMeasureSchema);

export default UnitOfMeasure;
