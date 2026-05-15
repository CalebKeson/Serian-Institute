// controllers/incomeTransaction.controller.js
import mongoose from 'mongoose';
import IncomeTransaction from '../models/incomeTransaction.model.js';
import { createIncome, updateIncomeAllocation } from '../services/incomeService.js';
import { errorHandler } from '../utils/error.js';

// @desc    Get all income transactions
// @route   GET /api/income
// @access  Private (Admin only)
export const getIncomeTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      sourceType,
      status,
      startDate,
      endDate,
      search,
      sortBy = 'incomeDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (sourceType) {
      query.sourceType = sourceType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.incomeDate = {};
      if (startDate) query.incomeDate.$gte = new Date(startDate);
      if (endDate) query.incomeDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { reference: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await IncomeTransaction.find(query)
      .populate('incomeSource', 'name type')
      .populate({
        path: 'studentId',  // FIXED: Changed from 'student' to 'studentId'
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('courseId', 'courseCode name')
      .populate('directorId', 'name')
      .populate('recordedBy', 'name email')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await IncomeTransaction.countDocuments(query);

    const summary = await IncomeTransaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          bySourceType: {
            $push: {
              sourceType: '$sourceType',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    let bySourceType = [];
    if (summary[0]?.bySourceType) {
      const sourceMap = {};
      summary[0].bySourceType.forEach(item => {
        if (!sourceMap[item.sourceType]) {
          sourceMap[item.sourceType] = 0;
        }
        sourceMap[item.sourceType] += item.amount;
      });
      bySourceType = Object.entries(sourceMap).map(([source, total]) => ({
        source,
        total
      }));
    }

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        results: total,
        limit: parseInt(limit)
      },
      summary: {
        totalAmount: summary[0]?.totalAmount || 0,
        totalTransactions: summary[0]?.totalTransactions || 0,
        averageAmount: summary[0]?.averageAmount || 0,
        bySourceType
      }
    });
  } catch (error) {
    console.error('Get income transactions error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single income transaction by ID
// @route   GET /api/income/:id
// @access  Private (Admin only)
export const getIncomeTransaction = async (req, res, next) => {
  try {
    const transaction = await IncomeTransaction.findById(req.params.id)
      .populate('incomeSource', 'name type description')
      .populate({
        path: 'studentId',  // FIXED: Changed from 'student' to 'studentId'
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('courseId', 'courseCode name')
      .populate('directorId', 'name email role')
      .populate('recordedBy', 'name email');

    if (!transaction) {
      return next(errorHandler(404, 'Income transaction not found'));
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get income transaction error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Create a new income transaction (manual entry)
// @route   POST /api/income
// @access  Private (Admin only)
export const createIncomeTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      sourceType,
      amount,
      incomeDate,
      description,
      reference,
      paymentMethod,
      directorId,
      investmentType,
      repaymentTerms,
      interestRate,
      donorName,
      donorType,
      grantReference,
      grantPeriod,
      paymentId,
      studentId,
      courseId
    } = req.body;

    if (!sourceType || !amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Source type and valid amount are required'));
    }

    let incomeData = {
      sourceType,
      amount,
      incomeDate: incomeDate || new Date(),
      description,
      reference,
      paymentMethod: paymentMethod || 'bank_transfer'
    };

    if (sourceType === 'director_investment') {
      if (!directorId) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, 'Director ID is required for director investments'));
      }
      incomeData = {
        ...incomeData,
        directorId,
        investmentType,
        repaymentTerms,
        interestRate
      };
    } else if (sourceType === 'grant') {
      incomeData = {
        ...incomeData,
        donorName,
        donorType,
        grantReference,
        grantPeriod
      };
    } else if (sourceType === 'donation') {
      incomeData = {
        ...incomeData,
        donorName,
        donorType
      };
    } else if (sourceType === 'fees') {
      if (!paymentId) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, 'Payment ID is required for fee income'));
      }
      incomeData = {
        ...incomeData,
        paymentId,
        studentId,
        courseId
      };
    }

    const transaction = await createIncome(incomeData, req.user._id, session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Income transaction recorded successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Create income error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Update an income transaction
// @route   PUT /api/income/:id
// @access  Private (Admin only)
export const updateIncomeTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      description,
      reference,
      status,
      incomeDate,
      allocatedAmount
    } = req.body;

    const transaction = await IncomeTransaction.findById(id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Income transaction not found'));
    }

    if (description !== undefined) transaction.description = description;
    if (reference !== undefined) transaction.reference = reference;
    if (status !== undefined) transaction.status = status;
    if (incomeDate !== undefined) transaction.incomeDate = incomeDate;
    
    if (allocatedAmount !== undefined && allocatedAmount !== transaction.allocatedAmount) {
      const diff = allocatedAmount - transaction.allocatedAmount;
      await updateIncomeAllocation(id, diff, session);
      await transaction.reload();
    } else {
      await transaction.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const updatedTransaction = await IncomeTransaction.findById(id)
      .populate('incomeSource', 'name type')
      .populate('directorId', 'name');

    res.json({
      success: true,
      data: updatedTransaction,
      message: 'Income transaction updated successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(500, error.message));
  }
};

// @desc    Allocate income to expenses
// @route   POST /api/income/:id/allocate
// @access  Private (Admin only)
export const allocateIncome = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Valid allocation amount is required'));
    }

    const transaction = await IncomeTransaction.findById(id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Income transaction not found'));
    }

    if (amount > transaction.unallocatedAmount) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, `Cannot allocate more than available balance (${transaction.unallocatedAmount})`));
    }

    const updatedTransaction = await updateIncomeAllocation(id, amount, session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      data: updatedTransaction,
      message: `Successfully allocated ${amount} to expenses`
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete an income transaction
// @route   DELETE /api/income/:id
// @access  Private (Admin only)
export const deleteIncomeTransaction = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const transaction = await IncomeTransaction.findById(id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Income transaction not found'));
    }

    if (transaction.allocatedAmount > 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot delete income that has been allocated to expenses'));
    }

    if (transaction.sourceType === 'director_investment' && transaction.directorId) {
      const Director = mongoose.model('Director');
      const director = await Director.findById(transaction.directorId).session(session);
      if (director) {
        director.totalInvested -= transaction.amount;
        await director.save({ session });
      }
    }

    await transaction.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Income transaction deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(500, error.message));
  }
};

// @desc    Get income statistics / dashboard summary
// @route   GET /api/income/stats
// @access  Private (Admin only)
export const getIncomeStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = { status: 'received' };
    
    if (startDate || endDate) {
      matchStage.incomeDate = {};
      if (startDate) matchStage.incomeDate.$gte = new Date(startDate);
      if (endDate) matchStage.incomeDate.$lte = new Date(endDate);
    }

    const stats = await IncomeTransaction.aggregate([
      { $match: matchStage },
      {
        $facet: {
          totalStats: [
            {
              $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                totalCount: { $sum: 1 },
                averageAmount: { $avg: '$amount' },
                maxAmount: { $max: '$amount' },
                minAmount: { $min: '$amount' }
              }
            }
          ],
          bySourceType: [
            {
              $group: {
                _id: '$sourceType',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            },
            {
              $project: {
                sourceType: '$_id',
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
                  year: { $year: '$incomeDate' },
                  month: { $month: '$incomeDate' }
                },
                total: { $sum: '$amount' },
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
          recentTransactions: [
            { $sort: { incomeDate: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'students',
                localField: 'studentId',
                foreignField: '_id',
                as: 'studentInfo'
              }
            },
            {
              $lookup: {
                from: 'directors',
                localField: 'directorId',
                foreignField: '_id',
                as: 'directorInfo'
              }
            },
            {
              $project: {
                transactionNumber: 1,
                sourceType: 1,
                amount: 1,
                incomeDate: 1,
                description: 1,
                studentName: { $arrayElemAt: ['$studentInfo.user.name', 0] },
                directorName: { $arrayElemAt: ['$directorInfo.name', 0] }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0] || {
      totalStats: [{ totalAmount: 0, totalCount: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 }],
      bySourceType: [],
      monthlyTrend: [],
      recentTransactions: []
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get income stats error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get income by source type
// @route   GET /api/income/by-source/:sourceType
// @access  Private (Admin only)
export const getIncomeBySource = async (req, res, next) => {
  try {
    const { sourceType } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const query = { sourceType };
    
    if (startDate || endDate) {
      query.incomeDate = {};
      if (startDate) query.incomeDate.$gte = new Date(startDate);
      if (endDate) query.incomeDate.$lte = new Date(endDate);
    }

    const transactions = await IncomeTransaction.find(query)
      .populate('directorId', 'name')
      .populate({
        path: 'studentId',  // FIXED: Changed from 'student' to 'studentId'
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('courseId', 'courseCode name')
      .sort({ incomeDate: -1 })
      .limit(parseInt(limit));

    const total = await IncomeTransaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        sourceType,
        transactions,
        summary: {
          totalAmount: total[0]?.total || 0,
          totalCount: total[0]?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Get income by source error:', error);
    next(errorHandler(500, error.message));
  }
};