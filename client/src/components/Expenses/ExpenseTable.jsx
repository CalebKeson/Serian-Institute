// src/components/Expenses/ExpenseTable.jsx
import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Calendar,
  Building,
  FileText,
  MoreVertical
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/feeFormatter';

const ExpenseTable = ({
  expenses,
  loading,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onPay,
  showActions = true
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'expenseDate',
    direction: 'desc'
  });
  const [expandedRows, setExpandedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (expenseId) => {
    setExpandedRows(prev =>
      prev.includes(expenseId)
        ? prev.filter(id => id !== expenseId)
        : [...prev, expenseId]
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Draft' },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Paid' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    const config = badges[status] || badges.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredExpenses = expenses.filter(expense => {
    if (statusFilter && expense.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      expense.expenseNumber?.toLowerCase().includes(searchLower) ||
      expense.vendor?.toLowerCase().includes(searchLower) ||
      expense.description?.toLowerCase().includes(searchLower)
    );
  });

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'expenseDate') {
      aVal = new Date(a.expenseDate).getTime();
      bVal = new Date(b.expenseDate).getTime();
    } else if (sortConfig.key === 'totalAmount') {
      aVal = a.totalAmount || 0;
      bVal = b.totalAmount || 0;
    }

    if (sortConfig.direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const totalAmount = sortedExpenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

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

  if (sortedExpenses.length === 0) {
    return (
      <div className="text-center py-12">
        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {searchTerm || statusFilter ? 'Try adjusting your search or filters' : 'Get started by adding a new expense.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Quick Filters */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">Filter by status:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === '' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === 'draft' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Draft
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === 'approved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              statusFilter === 'paid' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="relative max-w-xs">
          <input
            type="text"
            placeholder="Search by number, vendor, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('expenseDate')}
            >
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Date</span>
                {sortConfig.key === 'expenseDate' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Expense #
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Vendor / Description
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('totalAmount')}
            >
              <div className="flex items-center justify-end space-x-1">
                <DollarSign className="w-3 h-3" />
                <span>Amount</span>
                {sortConfig.key === 'totalAmount' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
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
          {sortedExpenses.map((expense) => {
            const isExpanded = expandedRows.includes(expense._id);
            return (
              <React.Fragment key={expense._id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(expense.expenseDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {expense.expenseNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{expense.vendor}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{expense.description}</div>
                    {expense.items && expense.items.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        {expense.items.length} item{expense.items.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">
                    {formatCurrency(expense.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(expense.status)}
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleRowExpand(expense._id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onView(expense)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View expense"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {expense.status === 'draft' && (
                          <button
                            onClick={() => onEdit(expense)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                            title="Edit expense"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {expense.status !== 'paid' && (
                          <button
                            onClick={() => onDelete(expense)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>

                {/* Expanded Row - Items Preview */}
                {isExpanded && expense.items && expense.items.length > 0 && (
                  <tr className="bg-gray-50">
                    <td colSpan={showActions ? 6 : 5} className="px-6 py-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Breakdown Items</h4>
                        <div className="space-y-1">
                          {expense.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">{item.description}</span>
                                {item.category?.name && (
                                  <span className="ml-2 text-xs text-gray-500">({item.category.name})</span>
                                )}
                              </div>
                              <div className="text-right">
                                {item.quantity > 1 && (
                                  <span className="text-xs text-gray-500 mr-2">
                                    {item.quantity} × {formatCurrency(item.unitPrice)}
                                  </span>
                                )}
                                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                              </div>
                            </div>
                          ))}
                          {expense.items.length > 3 && (
                            <p className="text-xs text-gray-500 text-right">
                              + {expense.items.length - 3} more items
                            </p>
                          )}
                        </div>
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
            <td className="px-6 py-3 text-right text-sm font-bold text-red-600">
              {formatCurrency(totalAmount)}
            </td>
            <td colSpan={showActions ? 2 : 1}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default ExpenseTable;