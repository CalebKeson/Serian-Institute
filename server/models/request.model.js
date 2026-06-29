// models/request.model.js - COMPLETE UPDATED VERSION

import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema(
  {
    // ============ EXISTING FIELDS ============
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true
    },
    visitorEmail: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
    },
    visitorPhone: {
      type: String,
      required: [true, 'Phone number is required']
    },
    purpose: {
      type: String,
      required: [true, 'Purpose of visit is required'],
      enum: [
        'Admission Inquiry',
        'Fee Payment',
        'Document Submission',
        'Meeting Staff',
        'Complaint',
        'Other'
      ]
    },
    department: {
      type: String,
      enum: [
        'Admissions',
        'Accounts',
        'Administration',
        'Academic',
        'Library',
        'Sports',
        'Maintenance',
        'Other'
      ]
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    receptionist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduledDate: {
      type: Date,
      default: Date.now
    },
    resolvedDate: {
      type: Date
    },
    notes: [{
      content: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    attachments: [{
      filename: String,
      path: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // ============ NEW FIELDS FOR ONLINE ENQUIRIES ============
    
    // Source Tracking
    source: {
      type: String,
      enum: [
        'google',        // Google Search
        'facebook',      // Facebook
        'instagram',     // Instagram
        'linkedin',      // LinkedIn
        'tiktok',        // TikTok
        'twitter',       // Twitter/X
        'referral',      // Referral from someone
        'direct',        // Direct visit
        'advertisement', // Paid advertisement
        'other'          // Other
      ],
      default: 'direct'
    },
    sourceOther: {
      type: String,
      trim: true,
      maxlength: [100, 'Source cannot exceed 100 characters']
    },
    sourceUrl: {
      type: String,
      trim: true
    },
    referrer: {
      type: String,
      trim: true
    },

    // UTM Parameters
    utmSource: {
      type: String,
      trim: true
    },
    utmMedium: {
      type: String,
      trim: true
    },
    utmCampaign: {
      type: String,
      trim: true
    },
    utmTerm: {
      type: String,
      trim: true
    },
    utmContent: {
      type: String,
      trim: true
    },

    // Enquiry Details
    enquiryType: {
      type: String,
      enum: [
        'course_inquiry',
        'admission_inquiry',
        'fee_inquiry',
        'general_inquiry',
        'complaint',
        'feedback',
        'other'
      ],
      default: 'general_inquiry'
    },
    courseOfInterest: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    courseOfInterestNames: [{
      type: String,
      trim: true
    }],
    preferredContactMethod: {
      type: String,
      enum: ['email', 'phone', 'whatsapp', 'sms'],
      default: 'email'
    },
    bestTimeToContact: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'anytime'],
      default: 'anytime'
    },
    message: {
      type: String,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      trim: true
    },

    // Metadata
    isOnlineEnquiry: {
      type: Boolean,
      default: false
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },

    // Follow-up tracking
    followUpDate: {
      type: Date
    },
    followUpBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followUpNotes: {
      type: String,
      trim: true
    },
    convertedToVisit: {
      type: Boolean,
      default: false
    },
    convertedAt: {
      type: Date
    },
    visitRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request'
    }
  },
  {
    timestamps: true
  }
);

// ============ INDEXES ============
// Existing indexes
requestSchema.index({ status: 1, createdAt: -1 });
requestSchema.index({ receptionist: 1, createdAt: -1 });
requestSchema.index({ assignedTo: 1 });

// New indexes for online enquiries
requestSchema.index({ isOnlineEnquiry: 1 });
requestSchema.index({ source: 1 });
requestSchema.index({ enquiryType: 1 });
requestSchema.index({ submittedAt: -1 });
requestSchema.index({ convertedToVisit: 1 });

// ============ STATIC METHODS ============

// Get source breakdown statistics
requestSchema.statics.getSourceBreakdown = async function(startDate, endDate) {
  const matchStage = { 
    isOnlineEnquiry: true,
    submittedAt: { $gte: startDate, $lte: endDate }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Get enquiry trends over time
requestSchema.statics.getEnquiryTrends = async function(startDate, endDate, groupBy = 'day') {
  const matchStage = { 
    isOnlineEnquiry: true,
    submittedAt: { $gte: startDate, $lte: endDate }
  };
  
  let dateFormat;
  if (groupBy === 'day') dateFormat = '%Y-%m-%d';
  else if (groupBy === 'week') dateFormat = '%Y-%W';
  else if (groupBy === 'month') dateFormat = '%Y-%m';
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$submittedAt' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

// Get conversion rates by source
requestSchema.statics.getConversionRates = async function(startDate, endDate) {
  const matchStage = { 
    isOnlineEnquiry: true,
    submittedAt: { $gte: startDate, $lte: endDate }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$source',
        totalEnquiries: { $sum: 1 },
        convertedEnquiries: { 
          $sum: { $cond: ['$convertedToVisit', 1, 0] }
        }
      }
    },
    {
      $project: {
        source: '$_id',
        totalEnquiries: 1,
        convertedEnquiries: 1,
        conversionRate: {
          $multiply: [
            { $divide: ['$convertedEnquiries', '$totalEnquiries'] },
            100
          ]
        }
      }
    },
    { $sort: { totalEnquiries: -1 } }
  ]);
};

// ============ VIRTUAL FIELDS ============

// Virtual for source display name
requestSchema.virtual('sourceDisplay').get(function() {
  const sourceMap = {
    google: 'Google Search',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    tiktok: 'TikTok',
    twitter: 'Twitter/X',
    referral: 'Referral',
    direct: 'Direct Visit',
    advertisement: 'Advertisement',
    other: 'Other'
  };
  return sourceMap[this.source] || this.source || 'Unknown';
});

// Virtual for enquiry type display
requestSchema.virtual('enquiryTypeDisplay').get(function() {
  const typeMap = {
    course_inquiry: 'Course Inquiry',
    admission_inquiry: 'Admission Inquiry',
    fee_inquiry: 'Fee Inquiry',
    general_inquiry: 'General Inquiry',
    complaint: 'Complaint',
    feedback: 'Feedback',
    other: 'Other'
  };
  return typeMap[this.enquiryType] || this.enquiryType || 'Unknown';
});

// Virtual for UTM full string
requestSchema.virtual('utmFull').get(function() {
  const parts = [];
  if (this.utmSource) parts.push(`source=${this.utmSource}`);
  if (this.utmMedium) parts.push(`medium=${this.utmMedium}`);
  if (this.utmCampaign) parts.push(`campaign=${this.utmCampaign}`);
  return parts.length > 0 ? parts.join(' | ') : null;
});

// Ensure virtual fields are serialized
requestSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

requestSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

export default mongoose.model('Request', requestSchema);