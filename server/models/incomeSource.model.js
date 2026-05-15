// models/IncomeSource.model.js
import mongoose from 'mongoose';

const incomeSourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Income source name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['fees', 'director_investment', 'grant', 'donation', 'investment', 'auxiliary', 'other'],
    required: [true, 'Income source type is required']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('IncomeSource', incomeSourceSchema);