// frontend/src/services/referralAPI.js

import api from './api';

export const referralAPI = {
  // Get all referrers with pagination and filters
  getReferrers: (params = {}) => {
    const { page = 1, limit = 10, search = '', type = '', isActive = true } = params;
    return api.get('/referrals', {
      params: { page, limit, search, type, isActive }
    });
  },

  // Get single referrer by ID
  getReferrer: (id) => {
    return api.get(`/referrals/${id}`);
  },

  // Get referrer by referral code (public)
  getReferrerByCode: (code) => {
    return api.get(`/referrals/code/${code}`);
  },

  // Create new referrer
  createReferrer: (data) => {
    return api.post('/referrals', data);
  },

  // Update referrer
  updateReferrer: (id, data) => {
    return api.put(`/referrals/${id}`, data);
  },

  // Delete referrer
  deleteReferrer: (id) => {
    return api.delete(`/referrals/${id}`);
  },

  // Get referral leaderboard
  getLeaderboard: (params = {}) => {
    const { limit = 10, type = 'all' } = params;
    return api.get('/referrals/leaderboard', {
      params: { limit, type }
    });
  },

  // Record bonus payment for referrer
  recordBonusPayment: (id, data) => {
    return api.post(`/referrals/${id}/bonus`, data);
  },

  // Get referral statistics
  getReferralStats: () => {
    return api.get('/referrals/stats');
  },

  // Generate referral code for existing referrer
  generateReferralCode: (id) => {
    return api.post(`/referrals/${id}/generate-code`);
  }
};

export default referralAPI;