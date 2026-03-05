// src/components/Requests/RequestList.jsx
import React from 'react';
import { Link } from 'react-router';

const RequestList = ({ requests, loading }) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
          {requests.length === 0 ? 
            "No visitor requests have been created yet. Create your first request!" : 
            "No requests match your current filter."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Visitor Details
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
          {requests.map((request) => (
            <tr key={request._id} className="hover:bg-gray-50">
              {/* Visitor Details */}
              <td className="px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{request.visitorName}</p>
                  <p className="text-sm text-gray-500">{request.visitorPhone}</p>
                  {request.visitorEmail && (
                    <p className="text-sm text-gray-500 truncate">{request.visitorEmail}</p>
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
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestList;