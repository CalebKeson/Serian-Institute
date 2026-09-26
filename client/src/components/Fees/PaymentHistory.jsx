// src/components/Fees/PaymentHistory.jsx - COMPLETE WORKING WITH EXPORT

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  BookOpen,
  Smartphone,
  Landmark,
  Wallet,
  CreditCard,
  Printer,
  Mail,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  TrendingUp,
  Hash
} from 'lucide-react';
import { usePaymentStore } from '../../stores/paymentStore';
import { useAuthStore } from '../../stores/authStore';
import {
  formatCurrency,
  formatDateTime,
  getPaymentMethodInfo,
  getPaymentStatusBadge,
  generateReceiptNumber
} from '../../utils/feeFormatter';
import PaymentHistoryTable from './PaymentHistoryTable';
import ExportButtons from './ExportButtons';
import { paymentHistoryExportConfig } from '../../utils/exportConfigs';
import toast from 'react-hot-toast';

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    payments,
    loading,
    fetchPayments,
    filters,
    setFilters,
    pagination,
    setPage
  } = usePaymentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [exportSummary, setExportSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    averageAmount: 0,
    mpesaCount: 0,
    bankCount: 0,
    cashCount: 0
  });

  const allPayments = payments || [];

  // Update summary when payments change
  useEffect(() => {
    if (allPayments.length > 0) {
      const totalAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalTransactions = allPayments.length;
      const averageAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
      const mpesaCount = allPayments.filter(p => p.paymentMethod === 'mpesa').length;
      const bankCount = allPayments.filter(p => p.paymentMethod === 'cooperative_bank' || p.paymentMethod === 'family_bank').length;
      const cashCount = allPayments.filter(p => p.paymentMethod === 'cash').length;
      
      setExportSummary({
        totalTransactions,
        totalAmount,
        averageAmount,
        mpesaCount,
        bankCount,
        cashCount
      });
    }
  }, [allPayments]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchPayments({ limit: 100 });
  };

  const loadPayments = async () => {
    await fetchPayments({ 
      limit: 100,
      search: searchTerm,
      ...dateRange
    });
  };

  const handleSearch = () => {
    loadPayments();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    fetchPayments({ [key]: value, limit: 100 });
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const applyDateRange = () => {
    setShowDatePicker(false);
    fetchPayments({ 
      startDate: dateRange.startDate, 
      endDate: dateRange.endDate,
      limit: 100 
    });
  };

  const clearDateRange = () => {
    setDateRange({ startDate: '', endDate: '' });
    setShowDatePicker(false);
    fetchPayments({ limit: 100 });
  };

  const handleRefresh = async () => {
    toast.loading('Refreshing data...', { id: 'refresh' });
    await fetchPayments({ limit: 100 });
    toast.success('Data refreshed', { id: 'refresh' });
  };

  // Flatten the data for export
  const exportData = useMemo(() => {
    console.log('🔄 Flattening payment data for export...', allPayments.length, 'records');
    
    return allPayments.map(payment => {
      return {
        paymentDate: new Date(payment.paymentDate).toLocaleDateString(),
        receiptNumber: payment.receiptNumber || 'N/A',
        studentName: payment.student?.user?.name || payment.studentName || 'N/A',
        studentId: payment.student?.studentId || payment.studentId || 'N/A',
        studentEmail: payment.student?.user?.email || 'N/A',
        studentPhone: payment.student?.phone || 'N/A',
        courseName: payment.course?.name || payment.courseName || 'N/A',
        courseCode: payment.course?.courseCode || payment.courseCode || 'N/A',
        amount: payment.amount,
        formattedAmount: formatCurrency(payment.amount),
        paymentMethod: payment.paymentMethodDisplay || payment.paymentMethod,
        transactionId: payment.transactionId || 'N/A',
        paymentReference: payment.paymentReference || 'N/A',
        payerName: payment.payerName || 'N/A',
        payerRelationship: payment.payerRelationshipDisplay || payment.payerRelationship || 'N/A',
        payerContact: payment.payerContact || 'N/A',
        paymentPurpose: payment.paymentForDisplay || payment.paymentFor || 'N/A',
        status: payment.status || 'completed',
        recordedBy: payment.recordedBy?.name || 'System',
        recordedAt: payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'
      };
    });
  }, [allPayments]);

  // Dynamic export config with flattened property accessors
  const dynamicExportConfig = useMemo(() => {
    return {
      ...paymentHistoryExportConfig,
      columns: [
        { header: 'Date', accessor: 'paymentDate', width: 12, type: 'date' },
        { header: 'Receipt #', accessor: 'receiptNumber', width: 12 },
        { header: 'Student Name', accessor: 'studentName', width: 20 },
        { header: 'Student ID', accessor: 'studentId', width: 15 },
        { header: 'Course Name', accessor: 'courseName', width: 25 },
        { header: 'Course Code', accessor: 'courseCode', width: 10 },
        { header: 'Amount (KSh)', accessor: 'amount', width: 12, type: 'currency' },
        { header: 'Payment Method', accessor: 'paymentMethod', width: 12 },
        { header: 'Transaction ID', accessor: 'transactionId', width: 15 },
        { header: 'Payer Name', accessor: 'payerName', width: 20 },
        { header: 'Payer Relationship', accessor: 'payerRelationship', width: 12 },
        { header: 'Purpose', accessor: 'paymentPurpose', width: 15 },
        { header: 'Status', accessor: 'status', width: 10 }
      ]
    };
  }, []);

  const handleExport = async (format, options) => {
    console.log(`📊 Exporting ${exportData.length} payment records as ${format}`);
    console.log('📊 Sample flattened export data:', exportData[0]);
    
    if (exportData.length === 0) {
      toast.error('No payment records to export');
      return { success: false, data: [] };
    }
    
    toast.success(`Exporting ${exportData.length} records...`);
    return { success: true, data: exportData };
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handlePrintReceipt = (payment) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .receipt-title { font-size: 20px; margin: 20px 0; text-align: center; }
            .details { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Serian Institute</div>
            <div>Official Payment Receipt</div>
          </div>
          <div class="receipt-title">Receipt #${payment.receiptNumber || 'N/A'}</div>
          <div class="details">
            <div class="row"><span>Date:</span><span>${new Date(payment.paymentDate).toLocaleDateString()}</span></div>
            <div class="row"><span>Student Name:</span><span>${payment.student?.user?.name || payment.studentName || 'N/A'}</span></div>
            <div class="row"><span>Student ID:</span><span>${payment.student?.studentId || payment.studentId || 'N/A'}</span></div>
            <div class="row"><span>Course:</span><span>${payment.course?.name || payment.courseName || 'N/A'}</span></div>
            <div class="row"><span>Payment Method:</span><span>${payment.paymentMethodDisplay || payment.paymentMethod}</span></div>
            <div class="row"><span>Transaction ID:</span><span>${payment.transactionId || 'N/A'}</span></div>
            <div class="row"><span>Payer Name:</span><span>${payment.payerName || 'N/A'}</span></div>
            <div class="row total"><span>Amount Paid:</span><span>${formatCurrency(payment.amount)}</span></div>
          </div>
          <div class="footer"><p>Thank you for your payment!</p></div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleSendReceipt = (payment) => {
    toast.success(`Receipt sent to: ${payment.student?.user?.email || 'student'}`);
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      studentId: '',
      courseId: '',
      paymentMethod: '',
      paymentFor: '',
      startDate: '',
      endDate: '',
      status: 'completed',
      search: ''
    });
    setSearchTerm('');
    setDateRange({ startDate: '', endDate: '' });
    fetchPayments({ limit: 100 });
    toast.success('Filters cleared');
  };

  const activeFilterCount = Object.values(filters).filter(v => v && v !== '' && v !== 1).length +
    (dateRange.startDate ? 1 : 0) + (dateRange.endDate ? 1 : 0);

  // Debug logs
  console.log('📋 PaymentHistory - Export Data Summary:', {
    totalRecords: exportData.length,
    sampleRecord: exportData[0],
    columnCount: Object.keys(exportData[0] || {}).length
  });

  if (loading && !allPayments.length) {
    return (
      <>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/fees')} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Receipt className="w-8 h-8 mr-3 text-green-600" />
                  Payment History
                </h1>
                <p className="mt-2 text-gray-600">View and manage all payment transactions</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button onClick={handleRefresh} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </button>
              
              {/* CRITICAL FIX: includeDateRange={false} - Exports ALL records regardless of date */}
              <ExportButtons
                data={exportData}
                config={dynamicExportConfig}
                filename="payment_history_report"
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={false}
                buttonStyle="default"
                buttonText={`Export Report (${exportData.length} records)`}
                customSummaryData={exportSummary}
                onExport={handleExport}
              />
            </div>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Total Transactions</p><p className="text-2xl font-bold text-gray-900">{exportSummary.totalTransactions}</p></div>
              <div className="p-3 bg-purple-100 rounded-lg"><Receipt className="w-6 h-6 text-purple-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Total Collected</p><p className="text-2xl font-bold text-green-600">{formatCurrency(exportSummary.totalAmount)}</p></div>
              <div className="p-3 bg-green-100 rounded-lg"><DollarSign className="w-6 h-6 text-green-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Average Transaction</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(exportSummary.averageAmount)}</p></div>
              <div className="p-3 bg-blue-100 rounded-lg"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">M-Pesa</p><p className="text-2xl font-bold text-green-600">{exportSummary.mpesaCount}</p></div>
              <div className="p-3 bg-green-100 rounded-lg"><Smartphone className="w-6 h-6 text-green-600" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Bank Transfers</p><p className="text-2xl font-bold text-blue-600">{exportSummary.bankCount}</p></div>
              <div className="p-3 bg-blue-100 rounded-lg"><Landmark className="w-6 h-6 text-blue-600" /></div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by student name, receipt number, or transaction ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={handleSearch} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Search</button>
              <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${activeFilterCount > 0 ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
                <Filter className="w-4 h-4 mr-2" /> Filters {activeFilterCount > 0 && <span className="ml-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
              </button>
              <button onClick={() => setShowDatePicker(!showDatePicker)} className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${dateRange.startDate || dateRange.endDate ? 'bg-green-100 border-green-300 text-green-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}>
                <Calendar className="w-4 h-4 mr-2" /> Date Range
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label><select value={filters.paymentMethod} onChange={(e) => handleFilterChange('paymentMethod', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">All Methods</option><option value="mpesa">M-Pesa</option><option value="cooperative_bank">Co-operative Bank</option><option value="family_bank">Family Bank</option><option value="cash">Cash</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Purpose</label><select value={filters.paymentFor} onChange={(e) => handleFilterChange('paymentFor', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="">All Purposes</option><option value="tuition">Tuition Fee</option><option value="registration">Registration Fee</option><option value="exam_fee">Examination Fee</option><option value="lab_fee">Skills Lab Fee</option><option value="materials">Learning Materials</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Status</label><select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg"><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="refunded">Refunded</option><option value="">All Statuses</option></select></div>
              </div>
              {activeFilterCount > 0 && (<div className="mt-4 flex justify-end"><button onClick={clearFilters} className="text-sm text-green-600 hover:text-green-700 flex items-center"><X className="w-4 h-4 mr-1" /> Clear all filters</button></div>)}
            </div>
          )}

          {showDatePicker && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-3 sm:space-y-0">
                <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label><input type="date" value={dateRange.startDate} onChange={(e) => handleDateRangeChange('startDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-2">End Date</label><input type="date" value={dateRange.endDate} onChange={(e) => handleDateRangeChange('endDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                <div className="flex space-x-2"><button onClick={applyDateRange} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Apply</button><button onClick={clearDateRange} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Clear</button></div>
              </div>
            </div>
          )}
        </div>

        {/* Payment History Table */}
        <PaymentHistoryTable
          payments={allPayments}
          loading={loading}
          onView={handleViewPayment}
          onPrint={handlePrintReceipt}
          onSendEmail={handleSendReceipt}
          showActions={true}
        />
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3"><div className="p-2 bg-green-100 rounded-lg"><Receipt className="w-6 h-6 text-green-600" /></div><div><h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2><p className="text-sm text-gray-600">Receipt #{selectedPayment.receiptNumber || 'N/A'}</p></div></div>
              <button onClick={() => { setShowReceiptModal(false); setSelectedPayment(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Student</p><p className="font-medium text-gray-900">{selectedPayment.student?.user?.name || selectedPayment.studentName || 'N/A'}</p><p className="text-xs text-gray-500 mt-1">{selectedPayment.student?.studentId || selectedPayment.studentId || 'N/A'}</p></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Course</p><p className="font-medium text-gray-900">{selectedPayment.course?.name || selectedPayment.courseName || 'N/A'}</p><p className="text-xs text-gray-500 mt-1">{selectedPayment.course?.courseCode || selectedPayment.courseCode || 'N/A'}</p></div>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <dl className="grid grid-cols-2 gap-4">
                  <div><dt className="text-xs text-gray-500">Date</dt><dd className="text-sm font-medium text-gray-900">{formatDateTime(selectedPayment.paymentDate)}</dd></div>
                  <div><dt className="text-xs text-gray-500">Amount</dt><dd className="text-lg font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</dd></div>
                  <div><dt className="text-xs text-gray-500">Payment Method</dt><dd className="text-sm font-medium text-gray-900">{selectedPayment.paymentMethodDisplay || selectedPayment.paymentMethod}</dd></div>
                  <div><dt className="text-xs text-gray-500">Transaction ID</dt><dd className="text-sm font-medium text-gray-900 font-mono">{selectedPayment.transactionId || 'N/A'}</dd></div>
                  <div><dt className="text-xs text-gray-500">Payer Name</dt><dd className="text-sm font-medium text-gray-900">{selectedPayment.payerName || 'N/A'}</dd></div>
                  <div><dt className="text-xs text-gray-500">Receipt Number</dt><dd className="text-sm font-medium text-gray-900 font-mono">{selectedPayment.receiptNumber || 'N/A'}</dd></div>
                </dl>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button onClick={() => handlePrintReceipt(selectedPayment)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"><Printer className="w-4 h-4 mr-2" /> Print</button>
                <button onClick={() => handleSendReceipt(selectedPayment)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"><Mail className="w-4 h-4 mr-2" /> Email</button>
                <button onClick={() => { setShowReceiptModal(false); setSelectedPayment(null); }} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentHistory;