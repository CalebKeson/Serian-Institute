// models/IncomeTransaction.model.js
import mongoose from 'mongoose';

const incomeTransactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    required: true,
    unique: true
  },
  incomeSource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncomeSource',
    required: [true, 'Income source is required']
  },
  sourceType: {
    type: String,
    enum: ['fees', 'director_investment', 'grant', 'donation', 'investment', 'auxiliary', 'other'],
    required: [true, 'Source type is required']
  },
  
  // For student fees (links to existing payment)
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  
  // For director investments
  directorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Director'
  },
  investmentType: {
    type: String,
    enum: ['equity', 'loan', 'donation']
  },
  repaymentTerms: {
    type: String,
    enum: ['shares', 'dividends', 'interest', 'lump_sum'],
    default: 'shares'
  },
  interestRate: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // For grants/donations
  donorName: String,
  donorType: {
    type: String,
    enum: ['individual', 'organization', 'government', 'ngo', 'other']
  },
  grantReference: String,
  grantPeriod: String,
  
  // Common fields
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  incomeDate: {
    type: Date,
    required: [true, 'Income date is required'],
    default: Date.now
  },
  description: {
    type: String,
    trim: true
  },
  reference: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['mpesa', 'bank_transfer', 'cash', 'cheque', 'other'],
    required: [true, 'Payment method is required']
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'committed', 'cancelled'],
    default: 'received'
  },
  
  // Allocation tracking
  allocatedAmount: {
    type: Number,
    default: 0
  },
  unallocatedAmount: {
    type: Number,
    default: function() {
      return this.amount;
    }
  },
  
  // Metadata
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate transaction number before save
incomeTransactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const count = await mongoose.model('IncomeTransaction').countDocuments();
    const sequence = (count + 1).toString().padStart(4, '0');
    
    this.transactionNumber = `INC-${year}${month}-${sequence}`;
  }
  
  // Calculate unallocated amount
  this.unallocatedAmount = this.amount - this.allocatedAmount;
  
  next();
});

// Indexes
// incomeTransactionSchema.index({ transactionNumber: 1 });
incomeTransactionSchema.index({ incomeDate: -1 });
incomeTransactionSchema.index({ sourceType: 1 });
incomeTransactionSchema.index({ studentId: 1 });
incomeTransactionSchema.index({ directorId: 1 });
incomeTransactionSchema.index({ status: 1 });

export default mongoose.model('IncomeTransaction', incomeTransactionSchema);