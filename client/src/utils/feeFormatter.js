// src/utils/feeFormatter.js

/**
 * Format currency amount to KSh
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount with KSh
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'KSh 0';
  return `KSh ${amount.toLocaleString()}`;
};

/**
 * Format currency amount without symbol
 * @param {number} amount - The amount to format
 * @returns {string} Formatted amount without symbol
 */
export const formatCurrencyPlain = (amount) => {
  if (amount === undefined || amount === null) return '0';
  return amount.toLocaleString();
};

/**
 * Get payment status badge color
 * @param {string} status - Payment status
 * @returns {object} Color classes for badge
 */
export const getPaymentStatusBadge = (status) => {
  const statuses = {
    completed: { color: 'bg-green-100 text-green-800', icon: '✅' },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
    failed: { color: 'bg-red-100 text-red-800', icon: '❌' },
    refunded: { color: 'bg-purple-100 text-purple-800', icon: '↩️' }
  };
  return statuses[status] || { color: 'bg-gray-100 text-gray-800', icon: '❓' };
};

/**
 * Get fee status badge color
 * @param {string} status - Fee status (paid, partial, unpaid, overpaid)
 * @returns {object} Color classes for badge
 */
export const getFeeStatusBadge = (status) => {
  const statuses = {
    paid: { color: 'bg-green-100 text-green-800', label: 'Fully Paid', icon: '✅' },
    partial: { color: 'bg-yellow-100 text-yellow-800', label: 'Partial Payment', icon: '⚠️' },
    unpaid: { color: 'bg-red-100 text-red-800', label: 'Unpaid', icon: '❌' },
    overpaid: { color: 'bg-blue-100 text-blue-800', label: 'Overpaid', icon: '💰' }
  };
  return statuses[status] || { color: 'bg-gray-100 text-gray-800', label: 'Unknown', icon: '❓' };
};

/**
 * Get payment method display info
 * @param {string} method - Payment method
 * @returns {object} Method display info
 */
export const getPaymentMethodInfo = (method) => {
  const methods = {
    mpesa: { 
      label: 'M-Pesa', 
      icon: '📱', 
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200'
    },
    cooperative_bank: { 
      label: 'Co-operative Bank', 
      icon: '🏦', 
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200'
    },
    family_bank: { 
      label: 'Family Bank', 
      icon: '🏦', 
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      borderColor: 'border-purple-200'
    },
    cash: { 
      label: 'Cash', 
      icon: '💵', 
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200'
    },
    other: { 
      label: 'Other', 
      icon: '🔄', 
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200'
    }
  };
  return methods[method] || { 
    label: method, 
    icon: '❓', 
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200'
  };
};

/**
 * Get payment purpose display info
 * @param {string} purpose - Payment purpose
 * @returns {object} Purpose display info
 */
export const getPaymentPurposeInfo = (purpose) => {
  const purposes = {
    tuition: { label: 'Tuition Fee', icon: '📚', color: 'blue' },
    registration: { label: 'Registration Fee', icon: '📝', color: 'purple' },
    exam_fee: { label: 'Examination Fee', icon: '✍️', color: 'orange' },
    lab_fee: { label: 'Skills Lab Fee', icon: '🔬', color: 'indigo' },
    materials: { label: 'Learning Materials', icon: '📖', color: 'green' },
    other: { label: 'Other', icon: '🔄', color: 'gray' }
  };
  return purposes[purpose] || { label: purpose, icon: '❓', color: 'gray' };
};

/**
 * Calculate payment progress percentage
 * @param {number} paid - Amount paid
 * @param {number} total - Total fee
 * @returns {number} Percentage (0-100)
 */
export const calculateProgress = (paid, total) => {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
};

/**
 * Get progress bar color based on percentage
 * @param {number} percentage - Progress percentage
 * @returns {string} Color class for progress bar
 */
export const getProgressColor = (percentage) => {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-red-500';
};

/**
 * Get status text based on payment progress
 * @param {number} paid - Amount paid
 * @param {number} total - Total fee
 * @returns {string} Status text
 */
export const getPaymentStatusText = (paid, total) => {
  if (!total || total <= 0) return 'No Fee';
  if (paid >= total) return 'Fully Paid';
  if (paid > 0) return 'Partial Payment';
  return 'Unpaid';
};

/**
 * Calculate days overdue
 * @param {Date} dueDate - Due date
 * @returns {number} Days overdue (0 if not overdue)
 */
export const calculateDaysOverdue = (dueDate) => {
  if (!dueDate) return 0;
  const today = new Date();
  const due = new Date(dueDate);
  if (due > today) return 0;
  const diffTime = Math.abs(today - due);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get overdue badge color
 * @param {number} days - Days overdue
 * @returns {object} Color classes for badge
 */
export const getOverdueBadge = (days) => {
  if (days <= 0) return { color: 'bg-green-100 text-green-800', text: 'On Time' };
  if (days <= 7) return { color: 'bg-yellow-100 text-yellow-800', text: `${days} days overdue` };
  if (days <= 30) return { color: 'bg-orange-100 text-orange-800', text: `${days} days overdue` };
  return { color: 'bg-red-100 text-red-800', text: `${days} days overdue` };
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Format datetime for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted datetime
 */
export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Generate receipt number
 * @param {Object} payment - Payment object
 * @returns {string} Receipt number
 */
export const generateReceiptNumber = (payment) => {
  if (!payment) return 'RCP-000000';
  
  const date = new Date(payment.paymentDate || new Date());
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Use last 4 chars of payment ID or generate random
  const id = payment._id ? payment._id.slice(-4) : Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `RCP-${year}${month}${day}-${id}`;
};

/**
 * Calculate summary statistics from payments array
 * @param {Array} payments - Array of payments
 * @returns {object} Summary statistics
 */
export const calculatePaymentSummary = (payments) => {
  if (!payments || payments.length === 0) {
    return {
      totalAmount: 0,
      totalPayments: 0,
      averageAmount: 0,
      byMethod: {},
      byPurpose: {}
    };
  }

  const summary = {
    totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    totalPayments: payments.length,
    averageAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0) / payments.length,
    byMethod: {},
    byPurpose: {}
  };

  payments.forEach(payment => {
    // By method
    const method = payment.paymentMethod || 'other';
    if (!summary.byMethod[method]) {
      summary.byMethod[method] = { count: 0, total: 0 };
    }
    summary.byMethod[method].count++;
    summary.byMethod[method].total += payment.amount || 0;

    // By purpose
    const purpose = payment.paymentFor || 'other';
    if (!summary.byPurpose[purpose]) {
      summary.byPurpose[purpose] = { count: 0, total: 0 };
    }
    summary.byPurpose[purpose].count++;
    summary.byPurpose[purpose].total += payment.amount || 0;
  });

  return summary;
};

/**
 * Prepare data for payment method chart
 * @param {object} byMethod - Payment method breakdown
 * @returns {Array} Chart-ready data
 */
export const prepareMethodChartData = (byMethod) => {
  if (!byMethod) return [];
  
  return Object.entries(byMethod).map(([method, data]) => {
    const methodInfo = getPaymentMethodInfo(method);
    return {
      name: methodInfo.label,
      value: data.total,
      count: data.count,
      color: methodInfo.color,
      icon: methodInfo.icon
    };
  }).sort((a, b) => b.value - a.value);
};

/**
 * Prepare data for purpose chart
 * @param {object} byPurpose - Payment purpose breakdown
 * @returns {Array} Chart-ready data
 */
export const preparePurposeChartData = (byPurpose) => {
  if (!byPurpose) return [];
  
  return Object.entries(byPurpose).map(([purpose, data]) => {
    const purposeInfo = getPaymentPurposeInfo(purpose);
    return {
      name: purposeInfo.label,
      value: data.total,
      count: data.count,
      color: purposeInfo.color
    };
  }).sort((a, b) => b.value - a.value);
};

/**
 * Prepare data for daily trend chart
 * @param {Array} byDay - Daily payment data
 * @returns {Array} Chart-ready data
 */
export const prepareDailyTrendData = (byDay) => {
  if (!byDay) return [];
  
  return byDay.map(day => ({
    date: day._id,
    total: day.total,
    count: day.count,
    formattedDate: new Date(day._id).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));
};

/**
 * Prepare data for monthly trend chart
 * @param {Array} byMonth - Monthly payment data
 * @returns {Array} Chart-ready data
 */
export const prepareMonthlyTrendData = (byMonth) => {
  if (!byMonth) return [];
  
  return byMonth.map(month => ({
    month: month._id,
    total: month.total,
    count: month.count,
    formattedMonth: new Date(month._id + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }));
};

/**
 * Group payments by date for calendar view
 * @param {Array} payments - Payments array
 * @returns {object} Payments grouped by date
 */
export const groupPaymentsByDate = (payments) => {
  if (!payments) return {};
  
  return payments.reduce((groups, payment) => {
    const date = new Date(payment.paymentDate).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = {
        total: 0,
        count: 0,
        payments: []
      };
    }
    groups[date].total += payment.amount || 0;
    groups[date].count++;
    groups[date].payments.push(payment);
    return groups;
  }, {});
};

export default {
  formatCurrency,
  formatCurrencyPlain,
  getPaymentStatusBadge,
  getFeeStatusBadge,
  getPaymentMethodInfo,
  getPaymentPurposeInfo,
  calculateProgress,
  getProgressColor,
  getPaymentStatusText,
  calculateDaysOverdue,
  getOverdueBadge,
  formatDate,
  formatDateTime,
  generateReceiptNumber,
  calculatePaymentSummary,
  prepareMethodChartData,
  preparePurposeChartData,
  prepareDailyTrendData,
  prepareMonthlyTrendData,
  groupPaymentsByDate
};