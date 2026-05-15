// src/components/Directors/InvestmentHistoryTable.jsx
import React, { useState } from 'react';
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  Percent,
  CreditCard,
  Eye,
  Download,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const InvestmentHistoryTable = ({ investments, loading = false }) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'incomeDate',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (investmentId) => {
    setExpandedRows(prev =>
      prev.includes(investmentId)
        ? prev.filter(id => id !== investmentId)
        : [...prev, investmentId]
    );
  };

  const getInvestmentTypeBadge = (type) => {
    const badges = {
      equity: 'bg-green-100 text-green-800',
      loan: 'bg-yellow-100 text-yellow-800',
      donation: 'bg-purple-100 text-purple-800'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  const getRepaymentTermsBadge = (terms) => {
    const badges = {
      shares: 'bg-blue-100 text-blue-800',
      dividends: 'bg-green-100 text-green-800',
      interest: 'bg-orange-100 text-orange-800',
      lump_sum: 'bg-purple-100 text-purple-800'
    };
    return badges[terms] || 'bg-gray-100 text-gray-800';
  };

  const filteredInvestments = investments.filter(inv => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      inv.description?.toLowerCase().includes(searchLower) ||
      inv.reference?.toLowerCase().includes(searchLower) ||
      inv.investmentType?.toLowerCase().includes(searchLower)
    );
  });

  const sortedInvestments = [...filteredInvestments].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'amount') {
      aVal = a.amount || 0;
      bVal = b.amount || 0;
    } else if (sortConfig.key === 'incomeDate') {
      aVal = new Date(a.incomeDate).getTime();
      bVal = new Date(b.incomeDate).getTime();
    }

    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalInvested = sortedInvestments.reduce((sum, inv) => sum + (inv.amount || 0), 0);

  const handleExport = () => {
    if (sortedInvestments.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Interest Rate', 'Repayment Terms', 'Reference', 'Description'];
    const csvData = sortedInvestments.map(inv => [
      formatDate(inv.incomeDate),
      inv.investmentType?.toUpperCase() || 'Investment',
      inv.amount,
      inv.interestRate ? `${inv.interestRate}%` : 'N/A',
      inv.repaymentTerms?.toUpperCase() || 'N/A',
      inv.reference || 'N/A',
      inv.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Investment history exported');
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

  if (sortedInvestments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No investment records found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm ? 'Try adjusting your search' : 'No investments recorded yet'}
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
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Investment History</h3>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {sortedInvestments.length} records
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search investments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 w-48"
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
      <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">Total Invested</span>
          <span className="text-lg font-bold text-green-700">{formatCurrency(totalInvested)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('incomeDate')}
                  className="flex items-center space-x-1 hover:text-gray-700"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Date</span>
                  {sortConfig.key === 'incomeDate' && (
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
                Repayment Terms
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
            {sortedInvestments.map((investment) => {
              const isExpanded = expandedRows.includes(investment._id);
              return (
                <React.Fragment key={investment._id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(investment.incomeDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInvestmentTypeBadge(investment.investmentType)}`}>
                        {investment.investmentType?.toUpperCase() || 'Investment'}
                      </span>
                      {investment.interestRate && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          <Percent className="w-3 h-3 mr-0.5" />
                          {investment.interestRate}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                      {formatCurrency(investment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRepaymentTermsBadge(investment.repaymentTerms)}`}>
                        {investment.repaymentTerms?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investment.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleRowExpand(investment._id)}
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
                      <td colSpan="6" className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Description</p>
                            <p className="text-sm text-gray-900">
                              {investment.description || 'No description provided'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                            <p className="text-sm font-mono text-gray-900">
                              {investment.transactionNumber || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Recorded By</p>
                            <p className="text-sm text-gray-900">
                              {investment.recordedBy?.name || 'System'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-sm text-gray-900 capitalize">
                              {investment.paymentMethod?.replace('_', ' ') || 'N/A'}
                            </p>
                          </div>
                          {investment.notes && (
                            <div className="col-span-2 md:col-span-4">
                              <p className="text-xs text-gray-500 mb-1">Notes</p>
                              <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                {investment.notes}
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
            Showing {sortedInvestments.length} of {investments.length} investments
          </span>
          <div className="flex items-center space-x-2">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
              Equity: {investments.filter(i => i.investmentType === 'equity').length}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
              Loan: {investments.filter(i => i.investmentType === 'loan').length}
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-1"></span>
              Donation: {investments.filter(i => i.investmentType === 'donation').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentHistoryTable;