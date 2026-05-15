// src/components/Income/IncomeTable.jsx
import React, { useState } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  TrendingUp,
  Wallet,
  Landmark,
  Heart,
  Coffee,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';

const IncomeTable = ({
  transactions,
  loading,
  onView,
  onEdit,
  onDelete,
  onAllocate,
  showActions = true
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'incomeDate',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (transactionId) => {
    setExpandedRows(prev =>
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const getSourceBadge = (sourceType) => {
    const badges = {
      fees: { color: 'bg-blue-100 text-blue-800', icon: Wallet, label: 'Fees' },
      director_investment: { color: 'bg-purple-100 text-purple-800', icon: Landmark, label: 'Director' },
      grant: { color: 'bg-pink-100 text-pink-800', icon: Heart, label: 'Grant' },
      donation: { color: 'bg-red-100 text-red-800', icon: Heart, label: 'Donation' },
      auxiliary: { color: 'bg-orange-100 text-orange-800', icon: Coffee, label: 'Auxiliary' },
      other: { color: 'bg-gray-100 text-gray-800', icon: MoreHorizontal, label: 'Other' }
    };
    const config = badges[sourceType] || badges.other;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      received: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Received' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      committed: { color: 'bg-blue-100 text-blue-800', icon: TrendingUp, label: 'Committed' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    const config = badges[status] || badges.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(t => {
    if (sourceFilter && t.sourceType !== sourceFilter) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      t.transactionNumber?.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower) ||
      t.reference?.toLowerCase().includes(searchLower)
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'incomeDate') {
      aVal = new Date(a.incomeDate).getTime();
      bVal = new Date(b.incomeDate).getTime();
    } else if (sortConfig.key === 'amount') {
      aVal = a.amount || 0;
      bVal = b.amount || 0;
    }

    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalAmount = sortedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const allocatedAmount = sortedTransactions.reduce((sum, t) => sum + (t.allocatedAmount || 0), 0);

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
            <div className="h-10 w-10 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (sortedTransactions.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No income records found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm || sourceFilter ? 'Try adjusting your search or filters' : 'Get started by recording your first income.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Quick Filters */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">Filter by source:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSourceFilter('')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              sourceFilter === '' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSourceFilter('fees')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              sourceFilter === 'fees' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Fees
          </button>
          <button
            onClick={() => setSourceFilter('director_investment')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              sourceFilter === 'director_investment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Director
          </button>
          <button
            onClick={() => setSourceFilter('grant')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              sourceFilter === 'grant' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Grant
          </button>
          <button
            onClick={() => setSourceFilter('donation')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              sourceFilter === 'donation' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Donation
          </button>
          <button
            onClick={() => setSourceFilter('auxiliary')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              sourceFilter === 'auxiliary' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Auxiliary
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by number, description, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('incomeDate')}
            >
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Date</span>
                {sortConfig.key === 'incomeDate' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Transaction #
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Source / Description
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('amount')}
            >
              <div className="flex items-center justify-end space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>Amount</span>
                {sortConfig.key === 'amount' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Allocated
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
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
          {sortedTransactions.map((transaction) => {
            const isExpanded = expandedRows.includes(transaction._id);
            const allocationPercentage = transaction.amount > 0 
              ? ((transaction.allocatedAmount || 0) / transaction.amount) * 100 
              : 0;
            
            return (
              <React.Fragment key={transaction._id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.incomeDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.transactionNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getSourceBadge(transaction.sourceType)}
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {transaction.description || `${transaction.sourceType} income`}
                        </div>
                        {transaction.reference && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            Ref: {transaction.reference}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-700">
                        {formatCurrency(transaction.allocatedAmount || 0)}
                      </span>
                      <div className="w-20 bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className="h-1 rounded-full bg-purple-500"
                          style={{ width: `${Math.min(100, allocationPercentage)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleRowExpand(transaction._id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onView(transaction)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(transaction)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(transaction)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>

                {/* Expanded Row - Additional Details */}
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={showActions ? 7 : 6} className="px-6 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                          <p className="text-sm font-mono text-gray-900">{transaction._id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                          <p className="text-sm text-gray-900 capitalize">
                            {transaction.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Recorded By</p>
                          <p className="text-sm text-gray-900">{transaction.recordedBy?.name || 'System'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Recorded At</p>
                          <p className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</p>
                        </div>
                        {transaction.notes && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                              {transaction.notes}
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
        <tfoot className="bg-gray-50 border-t border-gray-200">
          <tr>
            <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-700">
              Total
            </td>
            <td className="px-6 py-3 text-right text-sm font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </td>
            <td className="px-6 py-3 text-right text-sm font-medium text-gray-700">
              {formatCurrency(allocatedAmount)} ({totalAmount > 0 ? ((allocatedAmount / totalAmount) * 100).toFixed(1) : 0}%)
            </td>
            <td colSpan={showActions ? 2 : 1}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default IncomeTable;