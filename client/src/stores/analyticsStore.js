// stores/analyticsStore.js - COMPLETE NEW FILE

import { create } from 'zustand';
import { analyticsAPI } from '../services/analyticsAPI';
import toast from 'react-hot-toast';

export const useAnalyticsStore = create((set, get) => ({
  // ============ STATE ============
  analyticsSummary: null,
  sourceBreakdown: null,
  conversionReport: null,
  topSources: null,
  dailyTrends: [],
  pageViews: [],
  loading: false,
  error: null,
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  },

  // ============ FETCH ANALYTICS SUMMARY ============
  fetchAnalyticsSummary: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().dateRange, ...params };
      const response = await analyticsAPI.getAnalyticsSummary(mergedParams);
      
      set({
        analyticsSummary: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analytics summary';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ FETCH SOURCE BREAKDOWN ============
  fetchSourceBreakdown: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().dateRange, ...params };
      const response = await analyticsAPI.getSourceBreakdown(mergedParams);
      
      set({
        sourceBreakdown: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch source breakdown';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ FETCH CONVERSION REPORT ============
  fetchConversionReport: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().dateRange, ...params };
      const response = await analyticsAPI.getConversionReport(mergedParams);
      
      set({
        conversionReport: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch conversion report';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ FETCH TOP SOURCES ============
  fetchTopSources: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const { limit = 5 } = params;
      const response = await analyticsAPI.getTopSources({ limit });
      
      set({
        topSources: response.data.data,
        loading: false
      });
      
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch top sources';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ FETCH DAILY TRENDS ============
  fetchDailyTrends: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().dateRange, ...params };
      const response = await analyticsAPI.getAnalyticsSummary(mergedParams);
      
      const trends = response.data.data?.dailyTrends || [];
      set({
        dailyTrends: trends,
        loading: false
      });
      
      return { success: true, data: trends };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch daily trends';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ FETCH PAGE VIEWS ============
  fetchPageViews: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().dateRange, ...params };
      const response = await analyticsAPI.getAnalyticsSummary(mergedParams);
      
      const pageViews = response.data.data?.pageViewsBySource || [];
      set({
        pageViews: pageViews,
        loading: false
      });
      
      return { success: true, data: pageViews };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch page views';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ FETCH ALL ANALYTICS DATA ============
  fetchAllAnalytics: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const mergedParams = { ...get().dateRange, ...params };
      
      const [summaryRes, sourceRes, conversionRes, topSourcesRes] = await Promise.all([
        analyticsAPI.getAnalyticsSummary(mergedParams),
        analyticsAPI.getSourceBreakdown(mergedParams),
        analyticsAPI.getConversionReport(mergedParams),
        analyticsAPI.getTopSources({ limit: 5 })
      ]);

      set({
        analyticsSummary: summaryRes.data.data,
        sourceBreakdown: sourceRes.data.data,
        conversionReport: conversionRes.data.data,
        topSources: topSourcesRes.data.data,
        loading: false
      });
      
      return { 
        success: true, 
        data: {
          summary: summaryRes.data.data,
          sources: sourceRes.data.data,
          conversions: conversionRes.data.data,
          topSources: topSourcesRes.data.data
        }
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch analytics data';
      set({ error: errorMessage, loading: false });
      return { success: false, message: errorMessage };
    }
  },

  // ============ DATE RANGE ACTIONS ============
  setDateRange: (startDate, endDate) => {
    set({ dateRange: { startDate, endDate } });
  },

  setDateRangePreset: (preset) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (preset) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }
    
    set({
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
  },

  // ============ CLEAR DATA ============
  clearAnalytics: () => {
    set({
      analyticsSummary: null,
      sourceBreakdown: null,
      conversionReport: null,
      topSources: null,
      dailyTrends: [],
      pageViews: [],
      loading: false,
      error: null
    });
  },

  // ============ RESET STORE ============
  resetStore: () => {
    set({
      analyticsSummary: null,
      sourceBreakdown: null,
      conversionReport: null,
      topSources: null,
      dailyTrends: [],
      pageViews: [],
      loading: false,
      error: null,
      dateRange: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    });
  }
}));