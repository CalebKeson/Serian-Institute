// backend/controllers/referral.controller.js - COMPLETE VERSION

import Referral from '../models/referral.model.js';
import Student from '../models/student.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';

// @desc    Get all referrers with pagination and filters
// @route   GET /api/referrals
export const getReferrers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', type = '', sortBy = 'totalReferrals', sortOrder = 'desc' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { referrerName: { $regex: search, $options: 'i' } },
        { referrerCode: { $regex: search, $options: 'i' } },
        { referrerContact: { $regex: search, $options: 'i' } },
        { referrerEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) query.referrerType = type;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const referrers = await Referral.find(query)
      .populate('studentsReferred', 'studentId user')
      .populate('createdBy', 'name email')
      .populate('bonusPaidBy', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Referral.countDocuments(query);
    
    // Populate student names for each referrer
    const referrersWithDetails = await Promise.all(
      referrers.map(async (referrer) => {
        const studentsWithDetails = await Promise.all(
          referrer.studentsReferred.map(async (student) => {
            const populatedStudent = await Student.findById(student._id)
              .populate('user', 'name email');
            return {
              _id: student._id,
              studentId: populatedStudent?.studentId,
              name: populatedStudent?.user?.name,
              email: populatedStudent?.user?.email,
              enrolledAt: student.enrolledAt || populatedStudent?.createdAt
            };
          })
        );
        
        return {
          ...referrer.toObject(),
          studentsReferred: studentsWithDetails,
          studentCount: studentsWithDetails.length
        };
      })
    );

    // Calculate summary statistics
    const summary = await Referral.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalReferrers: { $sum: 1 },
          totalReferrals: { $sum: '$totalReferrals' },
          totalBonusEarned: { $sum: '$bonusEarned' },
          totalBonusPaid: { $sum: { $cond: ['$bonusPaid', '$bonusEarned', 0] } }
        }
      }
    ]);

    res.json({
      success: true,
      data: referrersWithDetails,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        results: total,
        limit: parseInt(limit)
      },
      summary: summary[0] || {
        totalReferrers: 0,
        totalReferrals: 0,
        totalBonusEarned: 0,
        totalBonusPaid: 0
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get single referrer by ID
// @route   GET /api/referrals/:id
export const getReferrer = async (req, res, next) => {
  try {
    const referrer = await Referral.findById(req.params.id)
      .populate('studentsReferred', 'studentId user')
      .populate('createdBy', 'name email')
      .populate('bonusPaidBy', 'name email');

    if (!referrer) {
      return next(errorHandler(404, 'Referrer not found'));
    }

    const studentsWithDetails = await Promise.all(
      referrer.studentsReferred.map(async (student) => {
        const populatedStudent = await Student.findById(student._id)
          .populate('user', 'name email');
        return {
          _id: student._id,
          studentId: populatedStudent?.studentId,
          name: populatedStudent?.user?.name,
          email: populatedStudent?.user?.email,
          enrolledAt: student.enrolledAt || populatedStudent?.createdAt
        };
      })
    );

    const referrerWithDetails = {
      ...referrer.toObject(),
      studentsReferred: studentsWithDetails,
      studentCount: studentsWithDetails.length
    };

    res.json({
      success: true,
      data: referrerWithDetails
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Create new referrer
// @route   POST /api/referrals
export const createReferrer = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      referrerName,
      referrerType,
      referrerContact,
      referrerEmail,
      referrerDepartment,
      bonusPerStudent,
      notes
    } = req.body;

    if (!referrerName || !referrerType) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Referrer name and type are required'));
    }

    // Check if referrer already exists
    const existingReferrer = await Referral.findOne({ 
      referrerName: { $regex: new RegExp(`^${referrerName}$`, 'i') },
      referrerType
    }).session(session);

    if (existingReferrer) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Referrer with this name and type already exists'));
    }

    // Generate unique referrer code
    const codePrefix = referrerType.substring(0, 3).toUpperCase();
    const count = await Referral.countDocuments();
    const sequence = String(count + 1).padStart(4, '0');
    const referrerCode = `${codePrefix}${sequence}`;

    const [referrer] = await Referral.create([{
      referrerName,
      referrerType,
      referrerContact,
      referrerEmail,
      referrerDepartment,
      referrerCode,
      bonusPerStudent: bonusPerStudent || 0,
      notes,
      createdBy: req.user._id,
      isActive: true
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // Send notification
    try {
      await NotificationService.createForRole('admin', {
        title: '👥 New Referrer Added',
        message: `${referrerName} (${referrerType}) has been added as a referrer. Code: ${referrerCode}`,
        type: 'system',
        actionUrl: `/referrals/${referrer._id}`
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Referrer created successfully',
      data: referrer
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    
    console.error('Referrer creation error:', error);
    next(errorHandler(400, error.message));
  }
};

// @desc    Update referrer
// @route   PUT /api/referrals/:id
export const updateReferrer = async (req, res, next) => {
  try {
    const {
      referrerName,
      referrerType,
      referrerContact,
      referrerEmail,
      referrerDepartment,
      bonusPerStudent,
      notes,
      isActive
    } = req.body;

    const referrer = await Referral.findById(req.params.id);
    if (!referrer) {
      return next(errorHandler(404, 'Referrer not found'));
    }

    const changes = [];
    
    if (referrerName && referrerName !== referrer.referrerName) {
      changes.push(`Name changed from ${referrer.referrerName} to ${referrerName}`);
      referrer.referrerName = referrerName;
    }
    if (referrerType && referrerType !== referrer.referrerType) {
      changes.push(`Type changed from ${referrer.referrerType} to ${referrerType}`);
      referrer.referrerType = referrerType;
    }
    if (referrerContact !== undefined) referrer.referrerContact = referrerContact;
    if (referrerEmail !== undefined) referrer.referrerEmail = referrerEmail;
    if (referrerDepartment !== undefined) referrer.referrerDepartment = referrerDepartment;
    if (bonusPerStudent !== undefined) {
      if (bonusPerStudent !== referrer.bonusPerStudent) {
        changes.push(`Bonus per student changed from ${referrer.bonusPerStudent} to ${bonusPerStudent}`);
        referrer.bonusPerStudent = bonusPerStudent;
        // Recalculate bonus earned
        referrer.bonusEarned = referrer.totalReferrals * bonusPerStudent;
      }
    }
    if (notes !== undefined) referrer.notes = notes;
    if (isActive !== undefined) referrer.isActive = isActive;

    await referrer.save();

    if (changes.length > 0) {
      try {
        await NotificationService.createForRole('admin', {
          title: '📝 Referrer Updated',
          message: `${referrer.referrerName}'s information was updated. Changes: ${changes.join(', ')}`,
          type: 'system',
          actionUrl: `/referrals/${referrer._id}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
    }

    res.json({
      success: true,
      message: 'Referrer updated successfully',
      data: referrer
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return next(errorHandler(400, errors.join(', ')));
    }
    next(errorHandler(400, error.message));
  }
};

// @desc    Delete referrer
// @route   DELETE /api/referrals/:id
export const deleteReferrer = async (req, res, next) => {
  try {
    const referrer = await Referral.findById(req.params.id);
    if (!referrer) {
      return next(errorHandler(404, 'Referrer not found'));
    }

    if (referrer.studentsReferred && referrer.studentsReferred.length > 0) {
      return next(errorHandler(400, `Cannot delete referrer with ${referrer.studentsReferred.length} referred students. Consider deactivating instead.`));
    }

    const referrerName = referrer.referrerName;
    await referrer.deleteOne();

    try {
      await NotificationService.createForRole('admin', {
        title: '🗑️ Referrer Deleted',
        message: `Referrer ${referrerName} was permanently deleted by ${req.user.name || 'an admin'}.`,
        type: 'system',
        actionUrl: '/referrals'
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
    }

    res.json({
      success: true,
      message: 'Referrer deleted successfully'
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
export const getReferralLeaderboard = async (req, res, next) => {
  try {
    const { limit = 10, type = 'all' } = req.query;
    
    const matchStage = { isActive: true };
    if (type !== 'all') matchStage.referrerType = type;
    
    const leaderboard = await Referral.aggregate([
      { $match: matchStage },
      { 
        $lookup: {
          from: 'students',
          localField: 'studentsReferred',
          foreignField: '_id',
          as: 'studentDetails'
        }
      },
      {
        $addFields: {
          activeReferrals: {
            $size: {
              $filter: {
                input: '$studentDetails',
                as: 'student',
                cond: { $eq: ['$$student.status', 'active'] }
              }
            }
          }
        }
      },
      { $sort: { totalReferrals: -1, bonusEarned: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          referrerName: 1,
          referrerType: 1,
          referrerDepartment: 1,
          totalReferrals: 1,
          bonusEarned: 1,
          bonusPerStudent: 1,
          bonusPaid: 1,
          activeReferrals: 1,
          referrerCode: 1
        }
      }
    ]);

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item
    }));

    // Get summary by type
    const summaryByType = await Referral.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$referrerType',
          count: { $sum: 1 },
          totalReferrals: { $sum: '$totalReferrals' },
          totalBonusEarned: { $sum: '$bonusEarned' }
        }
      },
      { $sort: { totalReferrals: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        leaderboard: rankedLeaderboard,
        summaryByType,
        topReferrer: rankedLeaderboard[0] || null
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Record bonus payment for referrer
// @route   POST /api/referrals/:id/bonus
export const recordBonusPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { amount, paymentReference, notes } = req.body;
    const paidBy = req.user._id;

    const referrer = await Referral.findById(id).session(session);
    if (!referrer) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Referrer not found'));
    }

    if (referrer.bonusPaid) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Bonus already paid for this referrer'));
    }

    const bonusAmount = amount || referrer.bonusEarned;
    
    referrer.bonusPaid = true;
    referrer.bonusPaidDate = new Date();
    referrer.bonusPaidBy = paidBy;
    referrer.bonusPaymentReference = paymentReference;
    referrer.notes = notes ? `${referrer.notes || ''}\nBonus paid on ${new Date().toLocaleDateString()}: ${bonusAmount}`.trim() : referrer.notes;
    
    await referrer.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send notifications
    try {
      await NotificationService.createForRole('admin', {
        title: '💰 Bonus Payment Recorded',
        message: `Bonus of ${bonusAmount} paid to ${referrer.referrerName} for ${referrer.totalReferrals} referral(s). Reference: ${paymentReference || 'N/A'}`,
        type: 'system',
        actionUrl: `/referrals/${referrer._id}`
      });

      // If referrer has email, send notification
      if (referrer.referrerEmail) {
        // Here you could send an email notification
        console.log(`Bonus payment notification would be sent to ${referrer.referrerEmail}`);
      }
    } catch (notificationError) {
      console.error('Failed to send bonus payment notifications:', notificationError);
    }

    res.json({
      success: true,
      message: `Bonus payment of ${bonusAmount} recorded successfully`,
      data: referrer
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Bonus payment error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get referral statistics
// @route   GET /api/referrals/stats
export const getReferralStats = async (req, res, next) => {
  try {
    const totalReferrers = await Referral.countDocuments({ isActive: true });
    const totalReferrals = await Referral.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$totalReferrals' } } }
    ]);
    
    const totalBonusEarned = await Referral.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$bonusEarned' } } }
    ]);
    
    const totalBonusPaid = await Referral.aggregate([
      { $match: { isActive: true, bonusPaid: true } },
      { $group: { _id: null, total: { $sum: '$bonusEarned' } } }
    ]);

    const topReferrers = await Referral.find({ isActive: true })
      .sort({ totalReferrals: -1 })
      .limit(5)
      .select('referrerName referrerType totalReferrals bonusEarned');

    const referralsByType = await Referral.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$referrerType',
          count: { $sum: 1 },
          totalReferrals: { $sum: '$totalReferrals' },
          totalBonus: { $sum: '$bonusEarned' }
        }
      },
      { $sort: { totalReferrals: -1 } }
    ]);

    const monthlyTrend = await Referral.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          referrals: { $sum: '$totalReferrals' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        totalReferrers,
        totalReferrals: totalReferrals[0]?.total || 0,
        totalBonusEarned: totalBonusEarned[0]?.total || 0,
        totalBonusPaid: totalBonusPaid[0]?.total || 0,
        unpaidBonus: (totalBonusEarned[0]?.total || 0) - (totalBonusPaid[0]?.total || 0),
        topReferrers,
        referralsByType,
        monthlyTrend
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Get referrer by code (for public referral links)
// @route   GET /api/referrals/code/:code
export const getReferrerByCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const referrer = await Referral.findOne({ 
      referrerCode: code.toUpperCase(),
      isActive: true 
    }).select('referrerName referrerType referrerCode totalReferrals');
    
    if (!referrer) {
      return next(errorHandler(404, 'Invalid referral code'));
    }
    
    res.json({
      success: true,
      data: referrer
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Generate referral code for existing referrer
// @route   POST /api/referrals/:id/generate-code
export const generateReferralCode = async (req, res, next) => {
  try {
    const referrer = await Referral.findById(req.params.id);
    if (!referrer) {
      return next(errorHandler(404, 'Referrer not found'));
    }
    
    if (referrer.referrerCode) {
      return next(errorHandler(400, 'Referrer already has a code'));
    }
    
    const codePrefix = referrer.referrerType.substring(0, 3).toUpperCase();
    const count = await Referral.countDocuments();
    const sequence = String(count + 1).padStart(4, '0');
    const referrerCode = `${codePrefix}${sequence}`;
    
    referrer.referrerCode = referrerCode;
    await referrer.save();
    
    res.json({
      success: true,
      message: 'Referral code generated successfully',
      data: { referrerCode }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};