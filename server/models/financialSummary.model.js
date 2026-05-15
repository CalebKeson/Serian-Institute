// models/FinancialSummary.model.js
import mongoose from 'mongoose';

const financialSummarySchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  date: {
    type: Date,
    required: true
  },
  
  // Income totals by source
  totalIncome: {
    type: Number,
    default: 0
  },
  feesIncome: {
    type: Number,
    default: 0
  },
  directorInvestments: {
    type: Number,
    default: 0
  },
  grantsIncome: {
    type: Number,
    default: 0
  },
  donationsIncome: {
    type: Number,
    default: 0
  },
  auxiliaryIncome: {
    type: Number,
    default: 0
  },
  otherIncome: {
    type: Number,
    default: 0
  },
  
  // Expense totals
  totalExpenses: {
    type: Number,
    default: 0
  },
  expenseByCategory: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Net position
  netPosition: {
    type: Number,
    default: 0
  },
  
  // Director liabilities
  directorLiabilities: {
    type: Number,
    default: 0
  },
  
  // Cash position
  cashBalance: {
    type: Number,
    default: 0
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique period-date combination
financialSummarySchema.index({ period: 1, date: 1 }, { unique: true });

export default mongoose.model('FinancialSummary', financialSummarySchema);