// src/components/Directors/DirectorTable.jsx
import React, { useState } from 'react';
import {
  Users,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  UserCheck,
  UserX,
  TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';

const DirectorTable = ({
  directors,
  loading,
  onView,
  onEdit,
  onDelete,
  showActions = true
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  const [expandedRows, setExpandedRows] = useState([]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const toggleRowExpand = (directorId) => {
    setExpandedRows(prev =>
      prev.includes(directorId)
        ? prev.filter(id => id !== directorId)
        : [...prev, directorId]
    );
  };

  const sortedDirectors = [...directors].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'name') {
      aVal = a.name || '';
      bVal = b.name || '';
    } else if (sortConfig.key === 'totalInvested') {
      aVal = a.totalInvested || 0;
      bVal = b.totalInvested || 0;
    } else if (sortConfig.key === 'outstandingBalance') {
      aVal = a.outstandingBalance || 0;
      bVal = b.outstandingBalance || 0;
    } else if (sortConfig.key === 'role') {
      aVal = a.role || '';
      bVal = b.role || '';
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

  const getRoleBadge = (role) => {
    const badges = {
      chairman: 'bg-red-100 text-red-800',
      secretary: 'bg-blue-100 text-blue-800',
      treasurer: 'bg-green-100 text-green-800',
      member: 'bg-gray-100 text-gray-800'
    };
    return badges[role] || badges.member;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return {
        color: 'bg-green-100 text-green-800',
        icon: UserCheck,
        label: 'Active'
      };
    }
    return {
      color: 'bg-gray-100 text-gray-800',
      icon: UserX,
      label: 'Inactive'
    };
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

  if (directors.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No directors found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new director.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center space-x-1">
                <span>Director</span>
                {sortConfig.key === 'name' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('role')}
            >
              <div className="flex items-center space-x-1">
                <span>Role</span>
                {sortConfig.key === 'role' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('totalInvested')}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Total Invested</span>
                {sortConfig.key === 'totalInvested' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => handleSort('outstandingBalance')}
            >
              <div className="flex items-center justify-end space-x-1">
                <span>Outstanding</span>
                {sortConfig.key === 'outstandingBalance' && (
                  sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                )}
              </div>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
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
          {sortedDirectors.map((director) => {
            const statusBadge = getStatusBadge(director.isActive);
            const StatusIcon = statusBadge.icon;
            const isExpanded = expandedRows.includes(director._id);
            const repaymentPercentage = director.totalInvested > 0 
              ? ((director.totalRepaid / director.totalInvested) * 100).toFixed(1)
              : 0;

            return (
              <React.Fragment key={director._id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {director.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {director.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          {director.email}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center mt-0.5">
                          <Phone className="w-3 h-3 mr-1 text-gray-400" />
                          {director.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(director.role)}`}>
                      {director.role?.toUpperCase() || 'MEMBER'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                    {formatCurrency(director.totalInvested || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-600">
                    {formatCurrency(director.outstandingBalance || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.color}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusBadge.label}
                    </span>
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => toggleRowExpand(director._id)}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          title="View details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => onView(director)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View director"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(director)}
                          className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                          title="Edit director"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(director)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete director"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>

                {/* Expanded Row - Investment Summary */}
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={showActions ? 6 : 5} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Total Invested</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(director.totalInvested || 0)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Total Repaid</p>
                          <p className="text-lg font-bold text-blue-600">{formatCurrency(director.totalRepaid || 0)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Repayment Rate</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-lg font-bold text-purple-600">{repaymentPercentage}%</p>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-purple-500"
                                style={{ width: `${repaymentPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">Shareholding: {director.shareholding || 0}%</p>
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
  );
};

export default DirectorTable;