// src/components/Directors/RepaymentHistoryTable.jsx
import React, { useState } from 'react';
import {
  CreditCard,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  ArrowUpRight,
  CheckCircle,
  Download,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const RepaymentHistoryTable = ({ director, loading = false }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'paymentDate',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Extract repayments from director data
  const repayments = director?.repayments || [];

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (repaymentId) => {
    setExpandedRows(prev =>
      prev.includes(repaymentId)
        ? prev.filter(id => id !== repaymentId)
        : [...prev, repaymentId]
    );
  };

  const getRepaymentTypeBadge = (type) => {
    const badges = {
      repayment: 'bg-blue-100 text-blue-800',
      dividend: 'bg-green-100 text-green-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const filteredRepayments = repayments.filter(rep => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      rep.description?.toLowerCase().includes(searchLower) ||
      rep.reference?.toLowerCase().includes(searchLower) ||
      rep.type?.toLowerCase().includes(searchLower)
    );
  });

  const sortedRepayments = [...filteredRepayments].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'amount') {
      aVal = a.amount || 0;
      bVal = b.amount || 0;
    } else if (sortConfig.key === 'paymentDate') {
      aVal = new Date(a.paymentDate).getTime();
      bVal = new Date(b.paymentDate).getTime();
    }

    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalRepaid = sortedRepayments.reduce((sum, rep) => sum + (rep.amount || 0), 0);

  const handleExport = () => {
    if (sortedRepayments.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Reference', 'Description'];
    const csvData = sortedRepayments.map(rep => [
      formatDate(rep.paymentDate),
      rep.type?.toUpperCase() || 'Repayment',
      rep.amount,
      rep.reference || 'N/A',
      rep.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repayment_history_${director?.name?.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Repayment history exported');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (sortedRepayments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No repayment records found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm ? 'Try adjusting your search' : 'No repayments recorded yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with Search and Export */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Repayment History</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {sortedRepayments.length} records
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search repayments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
            </div>
            <button
              onClick={handleExport}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-800">Total Repaid</span>
          <span className="text-lg font-bold text-blue-700">{formatCurrency(totalRepaid)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-blue-600">Repayment Progress</span>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-blue-500"
                style={{ width: `${(totalRepaid / (director?.totalInvested || 1)) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-blue-600">
              {((totalRepaid / (director?.totalInvested || 1)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end space-x-1 hover:text-gray-700"
                >
                  <DollarSign className="w-3 h-3" />
                  <span>Amount</span>
                  {sortConfig.key === 'amount' && (
                    sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedRepayments.map((repayment, index) => {
              const isExpanded = expandedRows.includes(repayment._id || index);
              return (
                <React.Fragment key={repayment._id || index}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(repayment.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRepaymentTypeBadge(repayment.type)}`}>
                        {repayment.type === 'dividend' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                        )}
                        {repayment.type === 'dividend' ? 'Dividend' : 'Loan Repayment'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">
                      {formatCurrency(repayment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {repayment.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleRowExpand(repayment._id || index)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                        title="View details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="5" className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-900">
                              {repayment.description || 'No description provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-sm text-gray-900 capitalize">
                              {repayment.paymentMethod?.replace('_', ' ') || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                            <p className="text-sm font-mono text-gray-900">
                              {repayment.reference || 'N/A'}
                            </p>
                          </div>
                          {repayment.notes && (
                            <div className="col-span-2 md:col-span-3">
                              <p className="text-xs text-gray-500 mb-1">Notes</p>
                              <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                {repayment.notes}
                              </p>
                            </div>
                          )}
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

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {sortedRepayments.length} of {repayments.length} repayments
          </span>
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
              Loan Repayments: {repayments.filter(r => r.type === 'repayment').length}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Dividends: {repayments.filter(r => r.type === 'dividend').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepaymentHistoryTable;