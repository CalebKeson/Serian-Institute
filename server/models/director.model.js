// models/Director.model.js
import mongoose from 'mongoose';

const directorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Director name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: {
    type: String,
    enum: ['chairman', 'secretary', 'treasurer', 'member'],
    default: 'member'
  },
  shareholding: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  totalRepaid: {
    type: Number,
    default: 0
  },
  outstandingBalance: {
    type: Number,
    default: 0
  },
  notes: {
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

// Calculate outstanding balance before save
directorSchema.pre('save', function(next) {
  this.outstandingBalance = this.totalInvested - this.totalRepaid;
  next();
});

export default mongoose.model('Director', directorSchema);