// src/components/Fees/PaymentHistoryTable.jsx - CORRECT DATA ACCESS

import React, { useState } from 'react';
import {
  Receipt,
  Eye,
  Printer,
  Mail,
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
  Hash
} from 'lucide-react';
import { formatCurrency, getPaymentMethodInfo } from '../../utils/feeFormatter';

const PaymentHistoryTable = ({
  payments = [],
  loading = false,
  onView,
  onPrint,
  onSendEmail,
  showActions = true
}) => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getMethodIcon = (method) => {
    const icons = { mpesa: Smartphone, cooperative_bank: Landmark, family_bank: Landmark, cash: Wallet, other: CreditCard };
    const Icon = icons[method] || CreditCard;
    return <Icon className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
        <p className="mt-1 text-sm text-gray-500">No payment records available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt #</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
              {showActions && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => {
              const isExpanded = expandedId === payment._id;
              const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
              
              // CORRECT data access - payment object has nested student and course
              const studentName = payment.student?.user?.name || payment.studentName || 'N/A';
              const studentId = payment.student?.studentId || payment.studentId || 'N/A';
              const courseName = payment.course?.name || payment.courseName || 'N/A';
              const courseCode = payment.course?.courseCode || payment.courseCode || 'N/A';

              return (
                <React.Fragment key={payment._id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">{studentName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{studentName}</div>
                          <div className="text-xs text-gray-500">ID: {studentId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{courseName}</div>
                      <div className="text-xs text-gray-500">{courseCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                        {payment.receiptNumber || 'N/A'}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${methodInfo.bgColor}`}>
                          {getMethodIcon(payment.paymentMethod)}
                        </div>
                        <span className="text-sm text-gray-600">{methodInfo.label}</span>
                      </div>
                      {payment.transactionId && (
                        <div className="text-xs text-gray-400 mt-1">Ref: {payment.transactionId}</div>
                      )}
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => toggleExpand(payment._id)} className="text-gray-400 hover:text-gray-600 p-1 rounded" title="Details">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {onView && <button onClick={() => onView(payment)} className="text-blue-600 hover:text-blue-800 p-1 rounded"><Eye className="w-4 h-4" /></button>}
                          {onPrint && <button onClick={() => onPrint(payment)} className="text-purple-600 hover:text-purple-800 p-1 rounded"><Printer className="w-4 h-4" /></button>}
                          {onSendEmail && <button onClick={() => onSendEmail(payment)} className="text-green-600 hover:text-green-800 p-1 rounded"><Mail className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    )}
                  </tr>

                  {/* Expanded Row - Direct access to payer fields */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={showActions ? 7 : 6} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          
                          {/* Payer Information */}
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b font-medium text-sm flex items-center">
                              <User className="w-4 h-4 mr-2 text-green-600" /> Payer Information
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Name:</span><span className="text-sm font-medium text-gray-900">{payment.payerName || 'N/A'}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Relationship:</span><span className="text-sm text-gray-700">{payment.payerRelationshipDisplay || payment.payerRelationship || 'N/A'}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Contact:</span><span className="text-sm text-gray-700">{payment.payerContact || 'N/A'}</span></div>
                            </div>
                          </div>
                          
                          {/* Payment Details */}
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 bg-gray-50 border-b font-medium text-sm flex items-center">
                              <Receipt className="w-4 h-4 mr-2 text-green-600" /> Payment Details
                            </div>
                            <div className="p-4 space-y-3">
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Purpose:</span><span className="text-sm font-medium text-gray-900">{payment.paymentForDisplay || payment.paymentFor || 'N/A'}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Reference:</span><span className="text-sm font-mono text-gray-700">{payment.paymentReference || 'N/A'}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Transaction ID:</span><span className="text-sm font-mono text-gray-700 break-all">{payment.transactionId || 'N/A'}</span></div>
                              <div className="flex justify-between"><span className="text-sm text-gray-500">Recorded By:</span><span className="text-sm text-gray-700">{payment.recordedBy?.name || 'System'}</span></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-4 pt-3 border-t border-gray-200">
                          <button onClick={() => onPrint?.(payment)} className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"><Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt</button>
                          <button onClick={() => onSendEmail?.(payment)} className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"><Mail className="w-3.5 h-3.5 mr-1.5" /> Email Receipt</button>
                        </div>
                       </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">Total Collected: <span className="font-bold text-gray-900">{formatCurrency(payments.reduce((sum, p) => sum + (p.amount || 0), 0))}</span></div>
          <div className="flex space-x-3">
            <span className="flex items-center text-xs"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>Completed: {payments.filter(p => p.status === 'completed').length}</span>
            <span className="flex items-center text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>Pending: {payments.filter(p => p.status === 'pending').length}</span>
            <span className="flex items-center text-xs"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>Failed: {payments.filter(p => p.status === 'failed').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;