// src/components/Requests/RequestList.jsx - UPDATED WITH ONLINE/PHYSICAL FILTER

import React, { useState } from 'react';
import { Link } from 'react-router';
import { Globe, User, Filter, X } from 'lucide-react';

const RequestList = ({ requests, loading, onFilterChange, currentFilter = 'all' }) => {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceDisplay = (source) => {
    const sourceMap = {
      google: 'Google',
      facebook: 'Facebook',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      tiktok: 'TikTok',
      twitter: 'Twitter',
      referral: 'Referral',
      direct: 'Direct',
      advertisement: 'Advert',
      other: 'Other'
    };
    return sourceMap[source] || source || 'Unknown';
  };

  const getSourceColor = (source) => {
    const colorMap = {
      google: 'bg-blue-100 text-blue-700',
      facebook: 'bg-blue-100 text-blue-700',
      instagram: 'bg-pink-100 text-pink-700',
      linkedin: 'bg-blue-100 text-blue-700',
      tiktok: 'bg-black/10 text-black',
      twitter: 'bg-blue-100 text-blue-700',
      referral: 'bg-purple-100 text-purple-700',
      direct: 'bg-gray-100 text-gray-700',
      advertisement: 'bg-orange-100 text-orange-700'
    };
    return colorMap[source] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'physical', label: 'Physical Visitors' },
    { value: 'online', label: 'Online Enquiries' }
  ];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
        <p className="text-gray-600">
          {currentFilter === 'online' ? 'No online enquiries have been submitted yet.' :
           currentFilter === 'physical' ? 'No physical visitor requests have been created yet.' :
           'No requests match your current filter.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Filter:</span>
          <div className="flex gap-1">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onFilterChange?.(option.value)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  currentFilter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {requests.length} {requests.length === 1 ? 'request' : 'requests'} found
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visitor Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose & Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status & Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => {
              const isOnline = request.isOnlineEnquiry;
              
              return (
                <tr key={request._id} className="hover:bg-gray-50">
                  {/* Visitor Details */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.visitorName}</p>
                      <p className="text-sm text-gray-500">{request.visitorPhone}</p>
                      {request.visitorEmail && (
                        <p className="text-sm text-gray-500 truncate max-w-[150px]">{request.visitorEmail}</p>
                      )}
                    </div>
                  </td>
                  
                  {/* Type & Source */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isOnline ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isOnline ? (
                          <>
                            <Globe className="w-3 h-3 mr-1" />
                            Online
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Physical
                          </>
                        )}
                      </span>
                      {isOnline && request.source && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSourceColor(request.source)}`}>
                          {getSourceDisplay(request.source)}
                        </span>
                      )}
                      {isOnline && request.utmSource && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                          UTM: {request.utmSource}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Purpose & Department */}
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.purpose}</p>
                      <p className="text-sm text-gray-500">{request.department}</p>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{request.description}</p>
                    </div>
                  </td>
                  
                  {/* Status & Priority */}
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                      </span>
                      {isOnline && request.convertedToVisit && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          ✓ Converted to Visit
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {/* Date & Actions */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-500">
                        {formatDate(request.createdAt)}
                      </p>
                      <div className="flex gap-2">
                        <Link
                          to={`/requests/${request._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RequestList;