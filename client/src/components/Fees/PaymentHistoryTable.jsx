// src/components/Fees/PaymentHistoryTable.jsx
import React, { useState } from 'react';
import {
  Receipt,
  Eye,
  Printer,
  Mail,
  Download,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  User,
  BookOpen,
  Smartphone,
  Landmark,
  Wallet,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  MoreVertical
} from 'lucide-react';
import {
  formatCurrency,
  formatDateTime,
  getPaymentMethodInfo,
  getPaymentPurposeInfo,
  getPaymentStatusBadge,
  generateReceiptNumber
} from '../../utils/feeFormatter';

const PaymentHistoryTable = ({
  payments = [],
  loading = false,
  onView,
  onPrint,
  onSendEmail,
  onExport,
  showStudentInfo = true,
  showCourseInfo = true,
  showActions = true,
  compact = false
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'paymentDate',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Sort and filter payments
  const filteredPayments = payments
    .filter(payment => {
      if (filterStatus && payment.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'studentName') {
        aVal = a.student?.user?.name || '';
        bVal = b.student?.user?.name || '';
      } else if (sortConfig.key === 'courseName') {
        aVal = a.course?.name || '';
        bVal = b.course?.name || '';
      } else if (sortConfig.key === 'amount') {
        aVal = a.amount || 0;
        bVal = b.amount || 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortConfig.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Toggle row expansion
  const toggleRowExpand = (paymentId) => {
    setExpandedRows(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get method icon
  const getMethodIcon = (method) => {
    const icons = {
      mpesa: Smartphone,
      cooperative_bank: Landmark,
      family_bank: Landmark,
      cash: Wallet,
      other: CreditCard
    };
    const Icon = icons[method] || CreditCard;
    return <Icon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredPayments.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {filterStatus ? 'Try clearing your filters' : 'No payment records available'}
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {filteredPayments.slice(0, 5).map((payment) => {
          const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
          const statusBadge = getPaymentStatusBadge(payment.status);
          
          return (
            <div key={payment._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${methodInfo.bgColor}`}>
                  {getMethodIcon(payment.paymentMethod)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(payment.paymentDate)}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                {payment.status}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Filter Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Filter by status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <span className="text-sm text-gray-500">
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('paymentDate')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <Calendar className="w-3 h-3" />
                <span>Date</span>
                {sortConfig.key === 'paymentDate' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            
            {showStudentInfo && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('studentName')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <User className="w-3 h-3" />
                  <span>Student</span>
                  {sortConfig.key === 'studentName' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
            )}
            
            {showCourseInfo && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('courseName')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Course</span>
                  {sortConfig.key === 'courseName' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
            )}
            
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <button
                onClick={() => handleSort('amount')}
                className="flex items-center space-x-1 hover:text-gray-700"
              >
                <DollarSign className="w-3 h-3" />
                <span>Amount</span>
                {sortConfig.key === 'amount' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </button>
            </th>
            
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
            
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Purpose
            </th>
            
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            
            {showActions && (
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredPayments.map((payment) => {
            const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
            const purposeInfo = getPaymentPurposeInfo(payment.paymentFor);
            const statusBadge = getPaymentStatusBadge(payment.status);
            const isExpanded = expandedRows.includes(payment._id);

            return (
              <React.Fragment key={payment._id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(payment.paymentDate)}
                  </td>
                  
                  {showStudentInfo && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {payment.student?.user?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.student?.user?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.student?.studentId || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  
                  {showCourseInfo && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.course?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {payment.course?.courseCode || ''}
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${methodInfo.bgColor}`}>
                        {getMethodIcon(payment.paymentMethod)}
                      </div>
                      <span className="text-sm text-gray-600">{methodInfo.label}</span>
                    </div>
                    {payment.transactionId && (
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {payment.transactionId}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {purposeInfo.label}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      {getStatusIcon(payment.status)}
                      <span className="ml-1 capitalize">{payment.status}</span>
                    </span>
                  </td>
                  
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleRowExpand(payment._id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        {onView && (
                          <button
                            onClick={() => onView(payment)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="View payment"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onPrint && (
                          <button
                            onClick={() => onPrint(payment)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                            title="Print receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        
                        {onSendEmail && (
                          <button
                            onClick={() => onSendEmail(payment)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                            title="Email receipt"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>

                {/* Expanded Row - Payment Details */}
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={showActions ? 8 : 7} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.transactionId || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Reference</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.paymentReference || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Receipt #</p>
                          <p className="text-sm font-medium text-gray-900">
                            {generateReceiptNumber(payment)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Recorded By</p>
                          <p className="text-sm font-medium text-gray-900">
                            {payment.recordedBy?.name || 'System'}
                          </p>
                        </div>
                        {payment.notes && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                              {payment.notes}
                            </p>
                          </div>
                        )}
                        <div className="col-span-2 flex items-center space-x-4">
                          <button
                            onClick={() => onPrint?.(payment)}
                            className="inline-flex items-center px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Printer className="w-3 h-3 mr-1" />
                            Print Receipt
                          </button>
                          <button
                            onClick={() => onSendEmail?.(payment)}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Mail className="w-3 h-3 mr-1" />
                            Email Receipt
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Summary Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500">
            Total: <span className="font-bold text-gray-900">
              {formatCurrency(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}
            </span>
          </div>
          <div className="flex space-x-4">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Completed: {filteredPayments.filter(p => p.status === 'completed').length}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
              Pending: {filteredPayments.filter(p => p.status === 'pending').length}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
              Failed: {filteredPayments.filter(p => p.status === 'failed').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;