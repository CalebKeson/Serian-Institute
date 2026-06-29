// controllers/analytics.controller.js - COMPLETE NEW FILE

import Analytics from '../models/analytics.model.js';
import Request from '../models/request.model.js';
import { errorHandler } from '../utils/error.js';

// ============ PUBLIC ROUTES (No Authentication) ============

// @desc    Track page view (public)
// @route   POST /api/analytics/track
// @access  Public
export const trackPageView = async (req, res, next) => {
  try {
    const {
      visitorId,
      sessionId,
      source,
      sourceUrl,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      page,
      pageTitle,
      path,
      device,
      browser,
      os,
      screenWidth,
      screenHeight,
      country,
      city,
      ipAddress
    } = req.body;

    // Validate required fields
    if (!visitorId) {
      return next(errorHandler(400, 'visitorId is required'));
    }

    // Create analytics record
    const analytics = await Analytics.create({
      visitorId,
      sessionId: sessionId || visitorId,
      source: source || 'direct',
      sourceUrl,
      referrer: referrer || req.headers.referer || null,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      page,
      pageTitle,
      path: path || req.path || '/',
      device: device || 'other',
      browser,
      os,
      screenWidth,
      screenHeight,
      country,
      city,
      ipAddress: ipAddress || req.ip || req.headers['x-forwarded-for'] || null,
      visitedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Page view tracked successfully',
      data: { id: analytics._id }
    });

  } catch (error) {
    console.error('Track page view error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Track conversion (public)
// @route   POST /api/analytics/convert
// @access  Public
export const trackConversion = async (req, res, next) => {
  try {
    const { visitorId, requestId } = req.body;

    if (!visitorId) {
      return next(errorHandler(400, 'visitorId is required'));
    }

    // Update all analytics records for this visitor
    const result = await Analytics.updateMany(
      { visitorId: visitorId },
      { 
        $set: { 
          converted: true, 
          convertedAt: new Date(),
          requestId: requestId || null
        } 
      }
    );

    res.json({
      success: true,
      message: 'Conversion tracked successfully',
      data: { updated: result.modifiedCount }
    });

  } catch (error) {
    console.error('Track conversion error:', error);
    next(errorHandler(500, error.message));
  }
};

// ============ ADMIN ROUTES (Authentication Required) ============

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Private (Admin only)
export const getAnalyticsSummary = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Admin access required'));
    }

    const { startDate, endDate } = req.query;
    
    // Set default date range (last 30 days)
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get total page views
    const totalViews = await Analytics.countDocuments({
      visitedAt: { $gte: start, $lte: end }
    });

    // Get unique visitors
    const uniqueVisitors = await Analytics.distinct('visitorId', {
      visitedAt: { $gte: start, $lte: end }
    });

    // Get total enquiries (online)
    const totalEnquiries = await Request.countDocuments({
      isOnlineEnquiry: true,
      submittedAt: { $gte: start, $lte: end }
    });

    // Get conversion rate
    const conversionRate = uniqueVisitors.length > 0 
      ? Math.round((totalEnquiries / uniqueVisitors.length) * 100) 
      : 0;

    // Get page views by source
    const pageViewsBySource = await Analytics.getPageViewsBySource(start, end);

    // Get unique visitors by source
    const uniqueVisitorsBySource = await Analytics.getUniqueVisitorsBySource(start, end);

    // Get daily trends
    const dailyTrends = await Analytics.getDailyTrends(start, end);

    // Get conversion funnel
    const conversionFunnel = await Analytics.getConversionFunnel(start, end);

    // Get source breakdown from enquiries
    const sourceBreakdown = await Request.getSourceBreakdown(start, end);

    // Get enquiry trends
    const enquiryTrends = await Request.getEnquiryTrends(start, end, 'day');

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        summary: {
          totalPageViews: totalViews,
          uniqueVisitors: uniqueVisitors.length,
          totalEnquiries: totalEnquiries,
          conversionRate: conversionRate,
          bounceRate: 0 // Could be calculated with more data
        },
        pageViewsBySource,
        uniqueVisitorsBySource,
        sourceBreakdown,
        dailyTrends,
        enquiryTrends,
        conversionFunnel
      }
    });

  } catch (error) {
    console.error('Get analytics summary error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get source breakdown chart data
// @route   GET /api/analytics/sources
// @access  Private (Admin only)
export const getSourceBreakdown = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Admin access required'));
    }

    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get page views by source
    const pageViews = await Analytics.getPageViewsBySource(start, end);
    
    // Get enquiries by source
    const enquiries = await Request.getSourceBreakdown(start, end);

    // Combine data
    const combined = {};
    
    // Add page views
    pageViews.forEach(item => {
      combined[item._id] = {
        source: item._id,
        pageViews: item.count,
        enquiries: 0
      };
    });
    
    // Add enquiries
    enquiries.forEach(item => {
      if (combined[item._id]) {
        combined[item._id].enquiries = item.count;
      } else {
        combined[item._id] = {
          source: item._id,
          pageViews: 0,
          enquiries: item.count
        };
      }
    });

    const result = Object.values(combined);

    // Add source display names
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

    const formattedResult = result.map(item => ({
      ...item,
      sourceDisplay: sourceMap[item.source] || item.source
    }));

    // Calculate totals
    const totalPageViews = formattedResult.reduce((sum, item) => sum + item.pageViews, 0);
    const totalEnquiries = formattedResult.reduce((sum, item) => sum + item.enquiries, 0);

    // Add percentages
    const finalResult = formattedResult.map(item => ({
      ...item,
      pageViewPercentage: totalPageViews > 0 ? Math.round((item.pageViews / totalPageViews) * 100) : 0,
      enquiryPercentage: totalEnquiries > 0 ? Math.round((item.enquiries / totalEnquiries) * 100) : 0
    }));

    res.json({
      success: true,
      data: {
        sources: finalResult,
        totals: {
          totalPageViews,
          totalEnquiries
        }
      }
    });

  } catch (error) {
    console.error('Get source breakdown error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get conversion report
// @route   GET /api/analytics/conversions
// @access  Private (Admin only)
export const getConversionReport = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Admin access required'));
    }

    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // Get conversion funnel
    const conversionFunnel = await Analytics.getConversionFunnel(start, end);

    // Get enquiry conversion rates by source
    const conversionRates = await Request.getConversionRates(start, end);

    // Get daily conversion trend
    const dailyTrend = await Analytics.aggregate([
      {
        $match: {
          visitedAt: { $gte: start, $lte: end },
          converted: true
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$convertedAt' } },
          conversions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end
        },
        overall: {
          totalUniqueVisitors: conversionFunnel.totalUniqueVisitors,
          totalConvertedVisitors: conversionFunnel.totalConvertedVisitors,
          overallConversionRate: conversionFunnel.overallConversionRate
        },
        bySource: conversionFunnel.bySource,
        conversionRates,
        dailyTrend
      }
    });

  } catch (error) {
    console.error('Get conversion report error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get top performing sources
// @route   GET /api/analytics/top-sources
// @access  Private (Admin only)
export const getTopSources = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(errorHandler(403, 'Admin access required'));
    }

    const { limit = 5 } = req.query;
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Get top sources by page views
    const topPageViews = await Analytics.aggregate([
      {
        $match: {
          visitedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get top sources by enquiries
    const topEnquiries = await Request.aggregate([
      {
        $match: {
          isOnlineEnquiry: true,
          submittedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get top sources by conversion
    const topConversions = await Analytics.aggregate([
      {
        $match: {
          visitedAt: { $gte: startDate, $lte: endDate },
          converted: true
        }
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Map source names
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

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate
        },
        topPageViews: topPageViews.map(item => ({
          ...item,
          sourceDisplay: sourceMap[item._id] || item._id
        })),
        topEnquiries: topEnquiries.map(item => ({
          ...item,
          sourceDisplay: sourceMap[item._id] || item._id
        })),
        topConversions: topConversions.map(item => ({
          ...item,
          sourceDisplay: sourceMap[item._id] || item._id
        }))
      }
    });

  } catch (error) {
    console.error('Get top sources error:', error);
    next(errorHandler(500, error.message));
  }
};