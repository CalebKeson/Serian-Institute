// backend/models/referral.model.js - NEW FILE

import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrerName: {
    type: String,
    required: [true, 'Referrer name is required'],
    trim: true
  },
  referrerType: {
    type: String,
    enum: ['employee', 'agent', 'student', 'social_media', 'advertisement', 'walk_in', 'other'],
    required: [true, 'Referrer type is required']
  },
  referrerContact: {
    type: String,
    trim: true
  },
  referrerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  referrerDepartment: {
    type: String,
    trim: true
  },
  referrerCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  studentsReferred: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  totalReferrals: {
    type: Number,
    default: 0,
    min: 0
  },
  // Bonus tracking
  bonusPerStudent: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  bonusPaid: {
    type: Boolean,
    default: false
  },
  bonusPaidDate: {
    type: Date
  },
  bonusPaidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bonusPaymentReference: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
referralSchema.index({ totalReferrals: -1 });
referralSchema.index({ referrerType: 1 });
referralSchema.index({ referrerCode: 1 });
referralSchema.index({ bonusPaid: 1 });

// Pre-save middleware to update totalReferrals
referralSchema.pre('save', function(next) {
  this.totalReferrals = this.studentsReferred.length;
  this.bonusEarned = this.totalReferrals * this.bonusPerStudent;
  next();
});

// Virtual for referral rank (calculated on query, not stored)
referralSchema.virtual('rank').get(function() {
  return null; // This will be calculated in aggregation
});

// Static method to get leaderboard
referralSchema.statics.getLeaderboard = async function(limit = 10) {
  return this.aggregate([
    { $match: { isActive: true } },
    { $sort: { totalReferrals: -1, bonusEarned: -1 } },
    { $limit: limit },
    {
      $project: {
        referrerName: 1,
        referrerType: 1,
        referrerDepartment: 1,
        totalReferrals: 1,
        bonusEarned: 1,
        bonusPaid: 1
      }
    }
  ]);
};

// Static method to get referral summary
referralSchema.statics.getSummary = async function() {
  const result = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$referrerType',
        count: { $sum: 1 },
        totalReferrals: { $sum: '$totalReferrals' },
        totalBonusEarned: { $sum: '$bonusEarned' },
        totalBonusPaid: {
          $sum: { $cond: ['$bonusPaid', '$bonusEarned', 0] }
        }
      }
    },
    { $sort: { totalReferrals: -1 } }
  ]);
  
  return result;
};

// Static method to find or create referrer
referralSchema.statics.findOrCreate = async function(referrerData, session = null) {
  try {
    let referrer = await this.findOne({ 
      referrerName: referrerData.referrerName,
      referrerType: referrerData.referrerType
    }).session(session);
    
    if (!referrer) {
      const [newReferrer] = await this.create([referrerData], { session });
      referrer = newReferrer;
    }
    
    return referrer;
  } catch (error) {
    console.error('Error in findOrCreate:', error);
    throw error;
  }
};

export default mongoose.model('Referral', referralSchema);