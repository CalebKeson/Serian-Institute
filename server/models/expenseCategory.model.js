// models/ExpenseCategory.model.js
import mongoose from 'mongoose';

const oneTimeBudgetSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Description is required for one-time budget'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required for one-time budget'],
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Date is required for one-time budget']
  },
  status: {
    type: String,
    enum: ['planned', 'actual', 'cancelled'],
    default: 'planned'
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const expenseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    default: null
  },
  description: {
    type: String,
    trim: true
  },
  
  // Budget configuration
  budgetType: {
    type: String,
    enum: ['recurring', 'one-time', 'none'],
    default: 'recurring'
  },
  
  // Recurring budget fields
  budgetPeriod: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  budgetAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  budgetStartMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: 1
  },
  budgetEndMonth: {
    type: Number,
    min: 1,
    max: 12,
    default: 12
  },
  
  // One-time budgets
  oneTimeBudgets: [oneTimeBudgetSchema],
  
  // Common fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
// expenseCategorySchema.index({ name: 1 });
expenseCategorySchema.index({ parentCategory: 1 });
expenseCategorySchema.index({ budgetType: 1 });
expenseCategorySchema.index({ 'oneTimeBudgets.date': 1 });

// Virtual for total one-time budget amount
expenseCategorySchema.virtual('totalOneTimeBudget').get(function() {
  return this.oneTimeBudgets
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.amount, 0);
});

// Virtual for total annual recurring budget
expenseCategorySchema.virtual('totalAnnualRecurringBudget').get(function() {
  if (this.budgetType !== 'recurring') return 0;
  
  const monthsInYear = this.budgetEndMonth - this.budgetStartMonth + 1;
  let annualAmount = 0;
  
  switch (this.budgetPeriod) {
    case 'monthly':
      annualAmount = this.budgetAmount * monthsInYear;
      break;
    case 'quarterly':
      annualAmount = this.budgetAmount * (monthsInYear / 3);
      break;
    case 'yearly':
      annualAmount = this.budgetAmount;
      break;
    default:
      annualAmount = 0;
  }
  
  return annualAmount;
});

// Method to get budget amount for a specific month
expenseCategorySchema.methods.getBudgetForMonth = function(year, month) {
  if (this.budgetType === 'one-time') {
    const oneTimeBudget = this.oneTimeBudgets.find(b => {
      const budgetDate = new Date(b.date);
      return budgetDate.getFullYear() === year && 
             budgetDate.getMonth() + 1 === month &&
             b.status !== 'cancelled';
    });
    return oneTimeBudget ? oneTimeBudget.amount : 0;
  }
  
  if (this.budgetType === 'recurring') {
    // Check if month is within budget period
    if (month < this.budgetStartMonth || month > this.budgetEndMonth) {
      return 0;
    }
    
    switch (this.budgetPeriod) {
      case 'monthly':
        return this.budgetAmount;
      case 'quarterly':
        // Return amount only for first month of each quarter
        const quarterStartMonths = [1, 4, 7, 10];
        if (quarterStartMonths.includes(month)) {
          return this.budgetAmount;
        }
        return 0;
      case 'yearly':
        // Return amount only for start month
        return month === this.budgetStartMonth ? this.budgetAmount : 0;
      default:
        return 0;
    }
  }
  
  return 0;
};

const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);

export default ExpenseCategory;