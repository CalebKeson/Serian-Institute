// pages/Notifications/Notifications.jsx - UPDATED WITH ALL NOTIFICATION TYPES
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useNotificationStore } from '../../stores/notificationStore';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { 
    notifications, 
    unreadCount,
    fetchNotifications, 
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loading 
  } = useNotificationStore();
  
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  
  useEffect(() => {
    loadNotifications();
    fetchUnreadCount();
  }, [typeFilter, statusFilter]);
  
  const loadNotifications = async () => {
    const params = { limit: 100 }; // Increased limit to see more
    
    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }
    
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }
    
    await fetchNotifications(params);
  };
  
  const handleRefresh = () => {
    loadNotifications();
    toast.success('Notifications refreshed');
  };
  
  const handleResetFilters = () => {
    setTypeFilter('all');
    setStatusFilter('all');
    toast.success('Filters reset');
  };
  
  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n._id));
    }
  };
  
  const handleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(notificationId => notificationId !== id)
        : [...prev, id]
    );
  };
  
  const handleBulkAction = async () => {
    if (!bulkAction || selectedNotifications.length === 0) {
      toast.error('Please select an action and notifications');
      return;
    }
    
    try {
      if (bulkAction === 'mark-read') {
        for (const id of selectedNotifications) {
          await markAsRead(id);
        }
        toast.success(`${selectedNotifications.length} notifications marked as read`);
      } else if (bulkAction === 'delete') {
        for (const id of selectedNotifications) {
          await deleteNotification(id);
        }
        toast.success(`${selectedNotifications.length} notifications deleted`);
      }
      
      setSelectedNotifications([]);
      setBulkAction('');
      loadNotifications();
    } catch (error) {
      toast.error('Failed to perform bulk action');
    }
  };
  
  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      toast.success('All notifications marked as read');
      loadNotifications();
    }
  };
  
  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      const result = await deleteAllNotifications();
      if (result.success) {
        toast.success('All notifications deleted');
        loadNotifications();
      }
    }
  };
  
  const getTypeIcon = (type) => {
    const icons = {
      request: '📋',
      course: '📚',
      student: '👨‍🎓',
      attendance: '✅',
      system: '⚙️',
      alert: '🔔',
      payment: '💰',
      grade: '📊',
      event: '📅'
    };
    return icons[type] || '📢';
  };
  
  const getTypeColor = (type) => {
    const colors = {
      request: 'bg-blue-100 text-blue-600',
      course: 'bg-purple-100 text-purple-600',
      student: 'bg-green-100 text-green-600',
      attendance: 'bg-teal-100 text-teal-600',
      system: 'bg-gray-100 text-gray-600',
      alert: 'bg-red-100 text-red-600',
      payment: 'bg-emerald-100 text-emerald-600',
      grade: 'bg-indigo-100 text-indigo-600',
      event: 'bg-orange-100 text-orange-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };
  
  const formatTime = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInSeconds = Math.floor((now - created) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return created.toLocaleDateString();
  };
  
  // COMPLETE: All notification types from your system
  const notificationTypes = [
    { id: 'all', label: 'All Types', icon: '📢' },
    { id: 'payment', label: 'Payments', icon: '💰' },
    { id: 'grade', label: 'Grades', icon: '📊' },
    { id: 'attendance', label: 'Attendance', icon: '✅' },
    { id: 'event', label: 'Events', icon: '📅' },
    { id: 'request', label: 'Requests', icon: '📋' },
    { id: 'course', label: 'Courses', icon: '📚' },
    { id: 'student', label: 'Students', icon: '👨‍🎓' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'alert', label: 'Alerts', icon: '🔔' }
  ];
  
  const statusOptions = [
    { id: 'all', label: 'All Status' },
    { id: 'unread', label: 'Unread' },
    { id: 'read', label: 'Read' }
  ];
  
  const areFiltersActive = typeFilter !== 'all' || statusFilter !== 'all';
  
  // Calculate counts for each type for display
  const getTypeCount = (typeId) => {
    if (typeId === 'all') return notifications.length;
    return notifications.filter(n => n.type === typeId).length;
  };
  
  const getStatusCount = (statusId) => {
    if (statusId === 'all') return notifications.length;
    if (statusId === 'unread') return notifications.filter(n => n.status === 'unread').length;
    return notifications.filter(n => n.status === 'read').length;
  };
  
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">
            Manage your notifications and alerts
          </p>
        </div>
        
        {/* Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {notifications.length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <span className="text-lg">📢</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Unread</p>
                <p className="text-xl font-bold text-yellow-600">
                  {unreadCount}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <span className="text-lg">🔔</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleMarkAllAsRead}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full"
                disabled={unreadCount === 0}
              >
                Mark All Read
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex-1"
              >
                Refresh
              </button>
              <button
                onClick={handleDeleteAll}
                className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex-1"
                disabled={notifications.length === 0}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters - Updated with all types */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Filters</span>
            {areFiltersActive && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Reset filters
              </button>
            )}
          </div>
          
          {/* Type Filters - Scrollable on mobile */}
          <div className="mb-4">
            <span className="text-xs font-medium text-gray-500 mb-2 block">Type</span>
            <div className="flex flex-wrap gap-2">
              {notificationTypes.map((type) => {
                const count = getTypeCount(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => setTypeFilter(type.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                      typeFilter === type.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{type.icon}</span>
                    {type.label}
                    {count > 0 && typeFilter !== type.id && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Status Filters */}
          <div>
            <span className="text-xs font-medium text-gray-500 mb-2 block">Status</span>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => {
                const count = getStatusCount(status.id);
                return (
                  <button
                    key={status.id}
                    onClick={() => setStatusFilter(status.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      statusFilter === status.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                    {count > 0 && (
                      <span className={`ml-1 text-xs ${
                        statusFilter === status.id ? 'text-white' : 'text-gray-500'
                      }`}>
                        ({count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Active Filters Summary */}
          {areFiltersActive && (
            <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Showing {typeFilter !== 'all' ? typeFilter : 'all types'} • {statusFilter !== 'all' ? statusFilter : 'all status'}
            </div>
          )}
        </div>
        
        {/* Bulk Actions Bar */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedNotifications.length} selected
                </span>
                
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-1.5 border border-blue-300 rounded-lg bg-white text-sm"
                >
                  <option value="">Select action...</option>
                  <option value="mark-read">Mark as read</option>
                  <option value="delete">Delete</option>
                </select>
                
                <button
                  onClick={handleBulkAction}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  disabled={!bulkAction}
                >
                  Apply
                </button>
              </div>
              
              <button
                onClick={() => setSelectedNotifications([])}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
        
        {/* Notifications List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <h2 className="font-medium text-gray-900">
                  Notifications {notifications.length > 0 && `(${notifications.length})`}
                </h2>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔔</span>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {statusFilter === 'unread' ? 'No unread notifications' : 'No notifications found'}
              </h3>
              <p className="text-sm text-gray-500">
                {statusFilter === 'unread' 
                  ? 'You\'re all caught up!' 
                  : areFiltersActive 
                    ? 'Try changing your filter settings' 
                    : 'New notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    notification.status === 'unread' ? 'bg-blue-50/30' : ''
                  }`}
                  onClick={() => {
                    if (notification.status === 'unread') {
                      markAsRead(notification._id);
                    }
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectNotification(notification._id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded border-gray-300"
                    />
                    
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${getTypeColor(notification.type)}`}>
                      <span className="text-base">{getTypeIcon(notification.type)}</span>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400">
                              {formatTime(notification.createdAt)}
                            </span>
                            {notification.status === 'unread' && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.status === 'unread' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;