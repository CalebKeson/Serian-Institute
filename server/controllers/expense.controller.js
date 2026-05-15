// controllers/expense.controller.js
import mongoose from 'mongoose';
import Expense from '../models/expense.model.js';
import ExpenseCategory from '../models/expenseCategory.model.js';
import IncomeTransaction from '../models/incomeTransaction.model.js';
import { errorHandler } from '../utils/error.js';

// @desc    Get all expenses with pagination and filters
// @route   GET /api/expenses
// @access  Private (Admin only)
export const getExpenses = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      vendor,
      startDate,
      endDate,
      search,
      sortBy = 'expenseDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (vendor) {
      query.vendor = { $regex: vendor, $options: 'i' };
    }

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { expenseNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query['items.category'] = new mongoose.Types.ObjectId(category);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .populate('items.category', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('paidBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    const summary = await Expense.aggregate([
      { $match: query },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$items.amount' },
          totalExpenses: { $sum: 1 },
          averageAmount: { $avg: '$items.amount' },
          byStatus: {
            $push: {
              status: '$status',
              amount: '$items.amount'
            }
          }
        }
      }
    ]);

    let byStatus = [];
    if (summary[0]?.byStatus) {
      const statusMap = {};
      summary[0].byStatus.forEach(item => {
        if (!statusMap[item.status]) {
          statusMap[item.status] = 0;
        }
        statusMap[item.status] += item.amount;
      });
      byStatus = Object.entries(statusMap).map(([status, total]) => ({
        status,
        total
      }));
    }

    res.json({
      success: true,
      data: expenses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        results: total,
        limit: parseInt(limit)
      },
      summary: {
        totalAmount: summary[0]?.totalAmount || 0,
        totalExpenses: summary[0]?.totalExpenses || 0,
        averageAmount: summary[0]?.averageAmount || 0,
        byStatus
      }
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single expense by ID
// @route   GET /api/expenses/:id
// @access  Private (Admin only)
export const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('items.category', 'name description')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('paidBy', 'name email')
      .populate('fundingSources.incomeTransactionId', 'transactionNumber sourceType amount');

    if (!expense) {
      return next(errorHandler(404, 'Expense not found'));
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Get expense error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Create a new expense with breakdown items
// @route   POST /api/expenses
// @access  Private (Admin only)
export const createExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      vendor,
      description,
      expenseDate,
      paymentDate,
      paymentMethod,
      items,
      notes,
      attachments,
      status = 'draft'
    } = req.body;

    if (!vendor || !description || !items || !items.length) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Vendor, description, and at least one item are required'));
    }

    for (const item of items) {
      if (!item.category || !item.description || !item.amount || item.amount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, 'Each item must have a category, description, and valid amount'));
      }

      const categoryExists = await ExpenseCategory.findById(item.category).session(session);
      if (!categoryExists) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, `Category ${item.category} not found`));
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const [expense] = await Expense.create([{
      vendor,
      description,
      expenseDate: expenseDate || new Date(),
      paymentDate,
      paymentMethod: paymentMethod || 'bank_transfer',
      totalAmount,
      items,
      notes,
      attachments,
      status,
      createdBy: req.user._id
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('items.category', 'name');

    res.status(201).json({
      success: true,
      data: populatedExpense,
      message: 'Expense created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create expense error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin only)
export const updateExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      vendor,
      description,
      expenseDate,
      paymentDate,
      paymentMethod,
      items,
      notes,
      attachments,
      status
    } = req.body;

    const expense = await Expense.findById(id).session(session);
    if (!expense) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Expense not found'));
    }

    if (status && status !== expense.status) {
      if (status === 'approved' && expense.status !== 'pending') {
        expense.approvedBy = req.user._id;
        expense.approvedAt = new Date();
      }
      if (status === 'paid' && expense.status !== 'approved') {
        expense.paidBy = req.user._id;
        expense.paidAt = new Date();
      }
    }

    if (vendor) expense.vendor = vendor;
    if (description) expense.description = description;
    if (expenseDate) expense.expenseDate = expenseDate;
    if (paymentDate) expense.paymentDate = paymentDate;
    if (paymentMethod) expense.paymentMethod = paymentMethod;
    if (items) {
      for (const item of items) {
        if (!item.category || !item.description || !item.amount || item.amount <= 0) {
          await session.abortTransaction();
          session.endSession();
          return next(errorHandler(400, 'Each item must have a category, description, and valid amount'));
        }
      }
      expense.items = items;
      expense.totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    }
    if (notes !== undefined) expense.notes = notes;
    if (attachments) expense.attachments = attachments;
    if (status) expense.status = status;

    await expense.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updatedExpense = await Expense.findById(id)
      .populate('items.category', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('paidBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update expense error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Submit expense for approval (change status from draft to pending)
// @route   POST /api/expenses/:id/submit
// @access  Private (Admin, Finance, or Creator)
export const submitForApproval = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id } = req.params;

    const expense = await Expense.findById(id).session(session);
    if (!expense) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Expense not found'));
    }

    if (expense.status !== 'draft') {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, `Cannot submit expense with status: ${expense.status}. Only draft expenses can be submitted for approval.`));
    }

    if (!expense.items || expense.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot submit expense with no items. Please add expense items first.'));
    }

    expense.status = 'pending';
    expense.submittedBy = req.user._id;
    expense.submittedAt = new Date();

    await expense.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // Populate outside transaction
    const updatedExpense = await Expense.findById(id)
      .populate('items.category', 'name')
      .populate('createdBy', 'name email')
      .populate('submittedBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
      message: 'Expense submitted for approval successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Submit for approval error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Approve an expense
// @route   POST /api/expenses/:id/approve
// @access  Private (Admin only)
export const approveExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id } = req.params;

    const expense = await Expense.findById(id).session(session);
    if (!expense) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Expense not found'));
    }

    if (expense.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, `Cannot approve expense with status: ${expense.status}`));
    }

    expense.status = 'approved';
    expense.approvedBy = req.user._id;
    expense.approvedAt = new Date();

    await expense.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    const updatedExpense = await Expense.findById(id)
      .populate('items.category', 'name')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json({
      success: true,
      data: updatedExpense,
      message: 'Expense approved successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Approve expense error:', error);
    next(errorHandler(500, error.message));
  }
};

// controllers/expense.controller.js
// Replace your existing payExpense function with this complete version

// @desc    Mark expense as paid with funding allocation
// @route   POST /api/expenses/:id/pay
// @access  Private (Admin only)
export const payExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id } = req.params;
    const { paymentDate, paymentMethod, fundingSources } = req.body;

    const expense = await Expense.findById(id).session(session);
    if (!expense) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Expense not found'));
    }

    if (expense.status !== 'approved') {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, `Cannot pay expense with status: ${expense.status}. Must be approved first.`));
    }

    // Validate and process funding sources
    if (fundingSources && fundingSources.length > 0) {
      const totalFunded = fundingSources.reduce((sum, fs) => sum + fs.amount, 0);
      if (Math.abs(totalFunded - expense.totalAmount) > 0.01) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, `Total funded amount (${totalFunded}) does not match expense total (${expense.totalAmount})`));
      }

      for (const source of fundingSources) {
        const income = await IncomeTransaction.findById(source.incomeTransactionId).session(session);
        if (!income) {
          await session.abortTransaction();
          session.endSession();
          return next(errorHandler(404, `Income transaction ${source.incomeTransactionId} not found`));
        }

        if (source.amount > income.unallocatedAmount) {
          await session.abortTransaction();
          session.endSession();
          return next(errorHandler(400, `Insufficient unallocated funds in income ${income.transactionNumber}`));
        }

        income.allocatedAmount += source.amount;
        income.unallocatedAmount = income.amount - income.allocatedAmount;
        await income.save({ session });
      }

      expense.fundingSources = fundingSources.map(fs => ({
        incomeTransactionId: fs.incomeTransactionId,
        sourceType: fs.sourceType,
        amount: fs.amount,
        date: new Date()
      }));
    }

    // FIX: Ensure paymentDate is always set when expense is marked as paid
    expense.status = 'paid';
    expense.paidBy = req.user._id;
    expense.paidAt = new Date();
    
    // Set paymentDate - use provided date, or current date, or expense date as fallback
    if (paymentDate) {
      expense.paymentDate = new Date(paymentDate);
    } else {
      expense.paymentDate = new Date(); // Use current date if not provided
    }
    
    if (paymentMethod) expense.paymentMethod = paymentMethod;

    await expense.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    const updatedExpense = await Expense.findById(id)
      .populate('fundingSources.incomeTransactionId', 'transactionNumber sourceType');

    res.json({
      success: true,
      data: updatedExpense,
      message: 'Expense marked as paid successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Pay expense error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin only)
export const deleteExpense = async (req, res, next) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const { id } = req.params;

    const expense = await Expense.findById(id).session(session);
    if (!expense) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Expense not found'));
    }

    if (expense.status === 'paid') {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot delete a paid expense'));
    }

    if (expense.fundingSources && expense.fundingSources.length > 0) {
      for (const source of expense.fundingSources) {
        const income = await IncomeTransaction.findById(source.incomeTransactionId).session(session);
        if (income) {
          income.allocatedAmount -= source.amount;
          income.unallocatedAmount = income.amount - income.allocatedAmount;
          await income.save({ session });
        }
      }
    }

    await expense.deleteOne({ session });
    
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete expense error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get expense statistics / dashboard summary
// @route   GET /api/expenses/stats
// @access  Private (Admin only)
export const getExpenseStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.expenseDate = {};
      if (startDate) matchStage.expenseDate.$gte = new Date(startDate);
      if (endDate) matchStage.expenseDate.$lte = new Date(endDate);
    }

    const stats = await Expense.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$items.amount' },
                totalExpenses: { $sum: 1 },
                averageAmount: { $avg: '$items.amount' },
                maxAmount: { $max: '$items.amount' },
                minAmount: { $min: '$items.amount' }
              }
            }
          ],
          byCategory: [
            {
              $group: {
                _id: '$items.category',
                total: { $sum: '$items.amount' },
                count: { $sum: 1 }
              }
            },
            {
              $lookup: {
                from: 'expensecategories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            { $unwind: '$categoryInfo' },
            {
              $project: {
                categoryId: '$_id',
                categoryName: '$categoryInfo.name',
                total: 1,
                count: 1,
                percentage: {
                  $multiply: [
                    { $divide: ['$total', { $sum: '$total' }] },
                    100
                  ]
                }
              }
            },
            { $sort: { total: -1 } }
          ],
          monthlyTrend: [
            {
              $group: {
                _id: {
                  year: { $year: '$expenseDate' },
                  month: { $month: '$expenseDate' }
                },
                total: { $sum: '$items.amount' },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                period: {
                  $concat: [
                    { $toString: '$_id.year' },
                    '-',
                    { $toString: '$_id.month' }
                  ]
                },
                total: 1,
                count: 1,
                monthName: {
                  $let: {
                    vars: {
                      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                    },
                    in: { $arrayElemAt: ["$$months", { $subtract: ['$_id.month', 1] }] }
                  }
                },
                year: '$_id.year'
              }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                total: { $sum: '$items.amount' },
                count: { $sum: 1 }
              }
            },
            { $sort: { total: -1 } }
          ],
          recentExpenses: [
            { $sort: { expenseDate: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'expensecategories',
                localField: 'items.category',
                foreignField: '_id',
                as: 'categoryInfo'
              }
            },
            {
              $project: {
                expenseNumber: 1,
                vendor: 1,
                description: 1,
                expenseDate: 1,
                totalAmount: 1,
                status: 1
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0] || {
      totalStats: [{ totalAmount: 0, totalExpenses: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 }],
      byCategory: [],
      monthlyTrend: [],
      byStatus: [],
      recentExpenses: []
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get expense stats error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get expenses by category
// @route   GET /api/expenses/by-category/:categoryId
// @access  Private (Admin only)
export const getExpensesByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const matchStage = {
      'items.category': new mongoose.Types.ObjectId(categoryId)
    };
    
    if (startDate || endDate) {
      matchStage.expenseDate = {};
      if (startDate) matchStage.expenseDate.$gte = new Date(startDate);
      if (endDate) matchStage.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.aggregate([
      { $unwind: '$items' },
      { $match: matchStage },
      { $sort: { expenseDate: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'expensecategories',
          localField: 'items.category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $project: {
          expenseNumber: 1,
          vendor: 1,
          expenseDate: 1,
          status: 1,
          itemDescription: '$items.description',
          amount: '$items.amount',
          categoryName: { $arrayElemAt: ['$categoryInfo.name', 0] }
        }
      }
    ]);

    const total = await Expense.aggregate([
      { $unwind: '$items' },
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$items.amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: expenses,
      summary: {
        totalAmount: total[0]?.total || 0,
        totalCount: total[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get expenses by category error:', error);
    next(errorHandler(500, error.message));
  }
};