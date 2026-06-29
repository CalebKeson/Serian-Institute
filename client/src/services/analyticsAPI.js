// services/analyticsAPI.js - COMPLETE SERVICE FILE

import api from './api';

// Public API URL (no authentication required for tracking)
const PUBLIC_API_URL = import.meta.env.VITE_REACT_APP_BACKEND_BASE_URL + '/api';

export const analyticsAPI = {
  // ============ PUBLIC ENDPOINTS (No Authentication Required) ============
  
  /**
   * Track a page view - called when a user visits any page
   * @param {Object} data - Page view data
   * @param {string} data.visitorId - Unique visitor identifier
   * @param {string} data.sessionId - Session identifier
   * @param {string} data.source - Traffic source (google, facebook, etc.)
   * @param {string} data.sourceUrl - The URL the visitor came from
   * @param {string} data.referrer - HTTP referrer
   * @param {string} data.utmSource - UTM source parameter
   * @param {string} data.utmMedium - UTM medium parameter
   * @param {string} data.utmCampaign - UTM campaign parameter
   * @param {string} data.utmTerm - UTM term parameter
   * @param {string} data.utmContent - UTM content parameter
   * @param {string} data.page - Current page path
   * @param {string} data.pageTitle - Current page title
   * @param {string} data.path - Full path with query string
   * @param {string} data.device - Device type (desktop, tablet, mobile)
   * @param {string} data.browser - Browser name
   * @param {string} data.os - Operating system
   * @param {number} data.screenWidth - Screen width in pixels
   * @param {number} data.screenHeight - Screen height in pixels
   * @param {string} data.country - Country (optional)
   * @param {string} data.city - City (optional)
   * @param {string} data.ipAddress - IP address (optional)
   */
  trackPageView: async (data) => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Track page view error:', error);
      return { success: false, message: error.message };
    }
  },
  
  /**
   * Track a conversion - when a user submits an enquiry
   * @param {Object} data - Conversion data
   * @param {string} data.visitorId - Unique visitor identifier
   * @param {string} data.requestId - ID of the created enquiry/request
   */
  trackConversion: async (data) => {
    try {
      const response = await fetch(`${PUBLIC_API_URL}/analytics/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Track conversion error:', error);
      return { success: false, message: error.message };
    }
  },

  // ============ ADMIN ENDPOINTS (Authentication Required) ============
  
  /**
   * Get analytics summary - overview of all metrics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Analytics summary data
   */
  getAnalyticsSummary: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/summary', {
      params: { startDate, endDate }
    });
  },
  
  /**
   * Get source breakdown - page views and enquiries by source
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Source breakdown data
   */
  getSourceBreakdown: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/sources', {
      params: { startDate, endDate }
    });
  },
  
  /**
   * Get conversion report - conversion rates by source
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Conversion report data
   */
  getConversionReport: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/conversions', {
      params: { startDate, endDate }
    });
  },
  
  /**
   * Get top performing sources
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of sources to return (default: 5)
   * @returns {Promise} - Top sources data
   */
  getTopSources: async (params = {}) => {
    const { limit = 5 } = params;
    return api.get('/analytics/top-sources', {
      params: { limit }
    });
  },
  
  /**
   * Get daily trends - page views and visitors over time
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Daily trends data
   */
  getDailyTrends: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/summary', {
      params: { startDate, endDate }
    }).then(response => {
      // Extract daily trends from summary response
      return {
        data: {
          data: response.data.data?.dailyTrends || []
        }
      };
    });
  },
  
  /**
   * Get page views by source
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Page views data
   */
  getPageViews: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/summary', {
      params: { startDate, endDate }
    }).then(response => {
      // Extract page views from summary response
      return {
        data: {
          data: response.data.data?.pageViewsBySource || []
        }
      };
    });
  },
  
  /**
   * Get conversion funnel data
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (YYYY-MM-DD)
   * @param {string} params.endDate - End date (YYYY-MM-DD)
   * @returns {Promise} - Conversion funnel data
   */
  getConversionFunnel: async (params = {}) => {
    const { startDate, endDate } = params;
    return api.get('/analytics/conversions', {
      params: { startDate, endDate }
    }).then(response => {
      // Extract conversion funnel from conversion report
      return {
        data: {
          data: {
            funnel: response.data.data?.conversionFunnel || {},
            bySource: response.data.data?.bySource || []
          }
        }
      };
    });
  }
};

export default analyticsAPI;