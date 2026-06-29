// models/analytics.model.js - COMPLETE NEW FILE

import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    // ============ VISITOR IDENTIFICATION ============
    visitorId: {
      type: String,
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      index: true
    },
    
    // ============ SOURCE TRACKING ============
    source: {
      type: String,
      enum: [
        'google', 'facebook', 'instagram', 'linkedin', 'tiktok', 
        'twitter', 'referral', 'direct', 'advertisement', 'other'
      ],
      default: 'direct'
    },
    sourceUrl: {
      type: String,
      trim: true
    },
    referrer: {
      type: String,
      trim: true
    },
    
    // ============ UTM PARAMETERS ============
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
    
    // ============ PAGE TRACKING ============
    page: {
      type: String,
      trim: true
    },
    pageTitle: {
      type: String,
      trim: true
    },
    path: {
      type: String,
      trim: true
    },
    
    // ============ DEVICE INFO ============
    device: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile', 'other'],
      default: 'other'
    },
    browser: {
      type: String,
      trim: true
    },
    os: {
      type: String,
      trim: true
    },
    screenWidth: {
      type: Number
    },
    screenHeight: {
      type: Number
    },
    
    // ============ LOCATION ============
    country: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    
    // ============ CONVERSION ============
    converted: {
      type: Boolean,
      default: false
    },
    convertedAt: {
      type: Date
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request'
    },
    
    // ============ TIMESTAMP ============
    visitedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// ============ INDEXES ============
analyticsSchema.index({ visitorId: 1, visitedAt: -1 });
analyticsSchema.index({ source: 1, visitedAt: -1 });
analyticsSchema.index({ converted: 1 });
analyticsSchema.index({ page: 1 });

// ============ STATIC METHODS ============

// Get page view statistics by source
analyticsSchema.statics.getPageViewsBySource = async function(startDate, endDate) {
  const matchStage = {
    visitedAt: { $gte: startDate, $lte: endDate }
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

// Get unique visitors by source
analyticsSchema.statics.getUniqueVisitorsBySource = async function(startDate, endDate) {
  const matchStage = {
    visitedAt: { $gte: startDate, $lte: endDate }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$source',
        uniqueVisitors: { $addToSet: '$visitorId' }
      }
    },
    {
      $project: {
        source: '$_id',
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }
    },
    { $sort: { uniqueVisitors: -1 } }
  ]);
};

// Get daily page view trends
analyticsSchema.statics.getDailyTrends = async function(startDate, endDate) {
  const matchStage = {
    visitedAt: { $gte: startDate, $lte: endDate }
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitedAt' } },
        views: { $sum: 1 },
        uniqueVisitors: { $addToSet: '$visitorId' }
      }
    },
    {
      $project: {
        date: '$_id',
        views: 1,
        uniqueVisitors: { $size: '$uniqueVisitors' }
      }
    },
    { $sort: { date: 1 } }
  ]);
};

// Get conversion funnel data
analyticsSchema.statics.getConversionFunnel = async function(startDate, endDate) {
  const matchStage = {
    visitedAt: { $gte: startDate, $lte: endDate }
  };
  
  const totalVisitors = await this.distinct('visitorId', matchStage);
  const convertedVisitors = await this.distinct('visitorId', {
    ...matchStage,
    converted: true
  });
  
  // Get visitors by source
  const visitorsBySource = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$source',
        visitors: { $addToSet: '$visitorId' }
      }
    },
    {
      $project: {
        source: '$_id',
        total: { $size: '$visitors' }
      }
    },
    { $sort: { total: -1 } }
  ]);
  
  // Get converted visitors by source
  const convertedBySource = await this.aggregate([
    { 
      $match: { 
        ...matchStage,
        converted: true 
      } 
    },
    {
      $group: {
        _id: '$source',
        visitors: { $addToSet: '$visitorId' }
      }
    },
    {
      $project: {
        source: '$_id',
        converted: { $size: '$visitors' }
      }
    },
    { $sort: { converted: -1 } }
  ]);
  
  // Combine the data
  const sourceData = visitorsBySource.map(item => {
    const converted = convertedBySource.find(c => c.source === item.source);
    return {
      source: item.source,
      totalVisitors: item.total,
      convertedVisitors: converted?.converted || 0,
      conversionRate: item.total > 0 
        ? Math.round((converted?.converted || 0) / item.total * 100) 
        : 0
    };
  });
  
  return {
    totalUniqueVisitors: totalVisitors.length,
    totalConvertedVisitors: convertedVisitors.length,
    overallConversionRate: totalVisitors.length > 0 
      ? Math.round(convertedVisitors.length / totalVisitors.length * 100) 
      : 0,
    bySource: sourceData
  };
};

// ============ VIRTUAL FIELDS ============

// Virtual for source display name
analyticsSchema.virtual('sourceDisplay').get(function() {
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

// Virtual for device display
analyticsSchema.virtual('deviceDisplay').get(function() {
  const deviceMap = {
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
    other: 'Other'
  };
  return deviceMap[this.device] || this.device || 'Unknown';
});

// Ensure virtual fields are serialized
analyticsSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

analyticsSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    return ret;
  }
});

export default mongoose.model('Analytics', analyticsSchema);