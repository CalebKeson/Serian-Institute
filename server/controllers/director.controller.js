// controllers/director.controller.js
import mongoose from 'mongoose';
import Director from '../models/director.model.js';
import IncomeTransaction from '../models/incomeTransaction.model.js';
import { createIncomeFromDirector } from '../services/incomeService.js';
import { errorHandler } from '../utils/error.js';
import NotificationService from '../services/notificationService.js';

// @desc    Get all directors
// @route   GET /api/directors
// @access  Private (Admin only)
export const getDirectors = async (req, res, next) => {
  try {
    const { isActive = true, search = '' } = req.query;
    
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }
    
    const directors = await Director.find(query)
      .sort({ name: 1 });
    
    // Calculate additional stats for each director
    const directorsWithStats = await Promise.all(directors.map(async (director) => {
      const investments = await IncomeTransaction.find({ 
        directorId: director._id,
        sourceType: 'director_investment',
        status: 'received'
      });
      
      const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const totalRepaid = director.totalRepaid || 0;
      const outstandingBalance = totalInvested - totalRepaid;
      
      return {
        ...director.toObject(),
        totalInvested,
        outstandingBalance,
        repaymentPercentage: totalInvested > 0 ? (totalRepaid / totalInvested) * 100 : 0
      };
    }));
    
    res.json({
      success: true,
      data: directorsWithStats,
      count: directorsWithStats.length
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single director by ID
// @route   GET /api/directors/:id
// @access  Private (Admin only)
export const getDirector = async (req, res, next) => {
  try {
    const director = await Director.findById(req.params.id);
    
    if (!director) {
      return next(errorHandler(404, 'Director not found'));
    }
    
    // Get all investments for this director
    const investments = await IncomeTransaction.find({ 
      directorId: director._id,
      sourceType: 'director_investment',
      status: 'received'
    }).sort({ incomeDate: -1 });
    
    // Calculate investment summary
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalRepaid = director.totalRepaid || 0;
    const outstandingBalance = totalInvested - totalRepaid;
    const repaymentPercentage = totalInvested > 0 ? (totalRepaid / totalInvested) * 100 : 0;
    
    // Get recent transactions
    const recentTransactions = await IncomeTransaction.find({ 
      directorId: director._id
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      data: {
        ...director.toObject(),
        investments,
        investmentSummary: {
          totalInvested,
          totalRepaid,
          outstandingBalance,
          repaymentPercentage,
          numberOfInvestments: investments.length
        },
        recentTransactions
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create a new director
// @route   POST /api/directors
// @access  Private (Admin only)
export const createDirector = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, phone, address, role, shareholding, notes } = req.body;
    
    // Check if director with same email exists
    const existingDirector = await Director.findOne({ email }).session(session);
    if (existingDirector) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Director with this email already exists'));
    }
    
    const director = await Director.create([{
      name,
      email,
      phone,
      address,
      role: role || 'member',
      shareholding: shareholding || 0,
      notes,
      totalInvested: 0,
      totalRepaid: 0,
      outstandingBalance: 0,
      isActive: true,
      createdBy: req.user._id
    }], { session });
    
    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATIONS =============
    try {
      // Notify all admins
      await NotificationService.createForRole('admin', {
        title: '👨‍💼 New Director Added',
        message: `${name} has been added as a new director (${role || 'member'}). Email: ${email}`,
        type: 'system',
        actionUrl: `/directors/${director[0]._id}`
      });

      // Send welcome notification to the director (if email exists)
      // Note: Directors might not have user accounts, so we can't send in-app notifications
      // This would be handled by email service separately
      console.log(`📧 Welcome email would be sent to: ${email}`);
    } catch (notificationError) {
      console.error('Failed to send director creation notifications:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      data: director[0],
      message: 'Director created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, messages.join(', ')));
    }
    next(errorHandler(500, error.message));
  }
};

// @desc    Update a director
// @route   PUT /api/directors/:id
// @access  Private (Admin only)
export const updateDirector = async (req, res, next) => {
  try {
    const { name, email, phone, address, role, shareholding, isActive, notes } = req.body;
    
    const director = await Director.findById(req.params.id);
    if (!director) {
      return next(errorHandler(404, 'Director not found'));
    }
    
    // Track changes for notification
    const changes = [];
    if (name && name !== director.name) changes.push(`name changed from "${director.name}" to "${name}"`);
    if (email && email !== director.email) changes.push(`email changed from "${director.email}" to "${email}"`);
    if (phone && phone !== director.phone) changes.push(`phone changed`);
    if (role && role !== director.role) changes.push(`role changed from "${director.role}" to "${role}"`);
    if (shareholding !== undefined && shareholding !== director.shareholding) changes.push(`shareholding changed from ${director.shareholding}% to ${shareholding}%`);
    if (isActive !== undefined && isActive !== director.isActive) changes.push(`status changed from ${director.isActive ? 'active' : 'inactive'} to ${isActive ? 'active' : 'inactive'}`);
    
    // Check email uniqueness if changing
    if (email && email !== director.email) {
      const existingDirector = await Director.findOne({ email });
      if (existingDirector) {
        return next(errorHandler(400, 'Director with this email already exists'));
      }
    }
    
    director.name = name || director.name;
    director.email = email || director.email;
    director.phone = phone || director.phone;
    director.address = address || director.address;
    director.role = role || director.role;
    director.shareholding = shareholding !== undefined ? shareholding : director.shareholding;
    director.isActive = isActive !== undefined ? isActive : director.isActive;
    director.notes = notes !== undefined ? notes : director.notes;
    
    await director.save();

    // ============= NOTIFICATIONS FOR UPDATE =============
    if (changes.length > 0) {
      try {
        await NotificationService.createForRole('admin', {
          title: '📝 Director Information Updated',
          message: `Updates made to ${director.name}'s profile: ${changes.join(', ')}`,
          type: 'system',
          actionUrl: `/directors/${director._id}`
        });
      } catch (notificationError) {
        console.error('Failed to send director update notifications:', notificationError);
      }
    }
    
    res.json({
      success: true,
      data: director,
      message: 'Director updated successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Record director investment
// @route   POST /api/directors/:id/investment
// @access  Private (Admin only)
export const recordDirectorInvestment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { 
      amount, 
      investmentType, 
      repaymentTerms, 
      interestRate,
      paymentMethod,
      reference,
      description,
      investmentDate 
    } = req.body;
    
    const director = await Director.findById(id).session(session);
    if (!director) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Director not found'));
    }
    
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Valid amount is required'));
    }
    
    // Create income transaction for this investment
    const incomeData = {
      directorId: director._id,
      amount,
      investmentType: investmentType || 'equity',
      repaymentTerms: repaymentTerms || 'shares',
      interestRate,
      paymentMethod: paymentMethod || 'bank_transfer',
      reference,
      description: description || `Investment by ${director.name}`,
      incomeDate: investmentDate || new Date()
    };
    
    const incomeTransaction = await createIncomeFromDirector(incomeData, req.user._id, session);
    
    // Update director's total invested
    director.totalInvested += amount;
    await director.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATIONS FOR INVESTMENT =============
    try {
      const formattedAmount = `KSh ${amount.toLocaleString()}`;
      
      // Notify all admins
      await NotificationService.createForRole('admin', {
        title: '💰 Director Investment Recorded',
        message: `${director.name} invested ${formattedAmount} in the institute. Investment type: ${investmentType || 'equity'}`,
        type: 'payment',
        actionUrl: `/directors/${director._id}`
      });

      // Special notification for large investments (>500,000)
      if (amount > 500000) {
        await NotificationService.createForRole('admin', {
          title: '⭐ Significant Investment Received',
          message: `${director.name} made a significant investment of ${formattedAmount}.`,
          type: 'alert',
          actionUrl: `/directors/${director._id}`
        });
      }
    } catch (notificationError) {
      console.error('Failed to send investment notifications:', notificationError);
    }
    
    res.status(201).json({
      success: true,
      data: {
        director,
        investment: incomeTransaction
      },
      message: 'Director investment recorded successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Record investment error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Record director repayment (loan repayment or dividend)
// @route   POST /api/directors/:id/repayment
// @access  Private (Admin only)
export const recordDirectorRepayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { amount, type, description, paymentDate } = req.body;
    
    const director = await Director.findById(id).session(session);
    if (!director) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Director not found'));
    }
    
    if (!amount || amount <= 0) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Valid amount is required'));
    }
    
    if (amount > director.totalInvested - director.totalRepaid) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Repayment amount exceeds outstanding balance'));
    }
    
    // Update director's repayment
    const oldBalance = director.totalInvested - director.totalRepaid;
    director.totalRepaid += amount;
    director.outstandingBalance = director.totalInvested - director.totalRepaid;
    await director.save({ session });
    
    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATIONS FOR REPAYMENT =============
    try {
      const formattedAmount = `KSh ${amount.toLocaleString()}`;
      
      // Notify all admins
      await NotificationService.createForRole('admin', {
        title: '💰 Director Repayment Recorded',
        message: `${director.name} received a repayment of ${formattedAmount}. Type: ${type || 'repayment'}. Remaining balance: KSh ${director.outstandingBalance.toLocaleString()}`,
        type: 'payment',
        actionUrl: `/directors/${director._id}`
      });

      // Notify if balance is now zero (fully repaid)
      if (director.outstandingBalance === 0) {
        await NotificationService.createForRole('admin', {
          title: '✅ Director Fully Repaid',
          message: `${director.name} has fully repaid all investments. Total repaid: KSh ${director.totalRepaid.toLocaleString()}`,
          type: 'system',
          actionUrl: `/directors/${director._id}`
        });
      }
    } catch (notificationError) {
      console.error('Failed to send repayment notifications:', notificationError);
    }
    
    res.json({
      success: true,
      data: {
        director,
        repayment: {
          amount,
          type: type || 'repayment',
          description,
          paymentDate: paymentDate || new Date(),
          newBalance: director.outstandingBalance
        }
      },
      message: 'Director repayment recorded successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Record repayment error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete a director
// @route   DELETE /api/directors/:id
// @access  Private (Admin only)
export const deleteDirector = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const director = await Director.findById(req.params.id).session(session);
    if (!director) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Director not found'));
    }
    
    // Check if director has any investments
    const hasInvestments = await IncomeTransaction.exists({ 
      directorId: director._id 
    }).session(session);
    
    if (hasInvestments) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Cannot delete director with existing investments. Deactivate instead.'));
    }
    
    const directorName = director.name;
    await director.deleteOne({ session });
    
    await session.commitTransaction();
    session.endSession();

    // ============= NOTIFICATION FOR DELETION =============
    try {
      await NotificationService.createForRole('admin', {
        title: '🗑️ Director Removed',
        message: `${directorName} has been removed from the directors list by ${req.user.name || 'an admin'}.`,
        type: 'system',
        actionUrl: '/directors'
      });
    } catch (notificationError) {
      console.error('Failed to send director deletion notification:', notificationError);
    }
    
    res.json({
      success: true,
      message: 'Director deleted successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(errorHandler(500, error.message));
  }
};

// @desc    Get director investment summary
// @route   GET /api/directors/summary
// @access  Private (Admin only)
export const getDirectorSummary = async (req, res, next) => {
  try {
    const directors = await Director.find({ isActive: true });
    
    const summary = {
      totalDirectors: directors.length,
      totalInvested: directors.reduce((sum, d) => sum + d.totalInvested, 0),
      totalRepaid: directors.reduce((sum, d) => sum + d.totalRepaid, 0),
      totalOutstanding: directors.reduce((sum, d) => sum + (d.totalInvested - d.totalRepaid), 0),
      byRole: {
        chairman: directors.filter(d => d.role === 'chairman').length,
        secretary: directors.filter(d => d.role === 'secretary').length,
        treasurer: directors.filter(d => d.role === 'treasurer').length,
        member: directors.filter(d => d.role === 'member').length
      }
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};