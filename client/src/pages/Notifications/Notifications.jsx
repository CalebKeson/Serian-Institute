// pages/Notifications/Notifications.jsx - UPDATED WITH SEPARATE FILTERS
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
  
  // CHANGED: Separate type and status filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  
  useEffect(() => {
    loadNotifications();
    fetchUnreadCount();
  }, [typeFilter, statusFilter]); // CHANGED: Watch both filters
  
  const loadNotifications = async () => {
    const params = { limit: 50 };
    
    // CHANGED: Apply both filters independently
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
  
  // Reset all filters
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
        // Mark selected as read
        for (const id of selectedNotifications) {
          await markAsRead(id);
        }
        toast.success(`${selectedNotifications.length} notifications marked as read`);
      } else if (bulkAction === 'delete') {
        // Delete selected
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
      alert: '🔔'
    };
    return icons[type] || '📢';
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
  
  // CHANGED: Update notification types without unread
  const notificationTypes = [
    { id: 'all', label: 'All Types', icon: '📢' },
    { id: 'request', label: 'Requests', icon: '📋' },
    { id: 'course', label: 'Courses', icon: '📚' },
    { id: 'student', label: 'Students', icon: '👨‍🎓' },
    { id: 'system', label: 'System', icon: '⚙️' },
    { id: 'alert', label: 'Alerts', icon: '🔔' }
  ];
  
  // NEW: Status filter options
  const statusOptions = [
    { id: 'all', label: 'All Status', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'read', label: 'Read', count: notifications.length - unreadCount }
  ];
  
  // Helper function to check if filters are active
  const areFiltersActive = typeFilter !== 'all' || statusFilter !== 'all';
  
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {notifications.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <span className="text-xl">📢</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {unreadCount}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                <span className="text-xl">🔔</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quick Actions</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={unreadCount === 0}
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters - UPDATED WITH SEPARATE FILTERS */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Filter Notifications</span>
            {areFiltersActive && (
              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset filters
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Type Filters */}
            <div>
              <span className="text-sm font-medium text-gray-700 mb-2 block">Type:</span>
              <div className="flex flex-wrap gap-2">
                {notificationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTypeFilter(type.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                      typeFilter === type.id 
                        ? 'bg-blue-100 text-blue-600 font-medium' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {type.icon && <span>{type.icon}</span>}
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Status Filters */}
            <div>
              <span className="text-sm font-medium text-gray-700 mb-2 block">Status:</span>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => setStatusFilter(status.id)}
                    className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                      statusFilter === status.id 
                        ? 'bg-blue-100 text-blue-600 font-medium' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {status.label}
                    {status.count > 0 && (
                      <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                        statusFilter === status.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {status.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Active Filters Indicator */}
          {areFiltersActive && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing: 
                <span className="font-medium text-gray-900 ml-1">
                  {typeFilter !== 'all' ? `${typeFilter} ` : 'all types '}
                  {statusFilter !== 'all' ? `${statusFilter} ` : 'all status '}
                  notifications
                </span>
              </p>
            </div>
          )}
        </div>
        
        {/* Bulk Actions Bar */}
        {selectedNotifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
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
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
        
        {/* Notifications List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Notifications {notifications.length > 0 && `(${notifications.length})`}
              </h2>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                  Select all
                </label>
                
                <button
                  onClick={handleDeleteAll}
                  className="text-sm text-red-600 hover:text-red-800"
                  disabled={notifications.length === 0}
                >
                  Delete all
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔔</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {statusFilter === 'unread' ? 'No unread notifications' : 'No notifications found'}
              </h3>
              <p className="text-gray-600">
                {statusFilter === 'unread' 
                  ? 'You have read all your notifications. Great job!' 
                  : areFiltersActive 
                    ? 'Try changing your filter settings' 
                    : 'New notifications will appear here when you have updates.'}
              </p>
              {areFiltersActive && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox for selection */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification._id)}
                      onChange={() => handleSelectNotification(notification._id)}
                      className="mt-1 rounded border-gray-300"
                    />
                    
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className={`p-3 rounded-lg ${
                        notification.type === 'request' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'course' ? 'bg-purple-100 text-purple-600' :
                        notification.type === 'student' ? 'bg-green-100 text-green-600' :
                        notification.type === 'alert' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <span className="text-xl">{getTypeIcon(notification.type)}</span>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {notification.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.createdAt)}
                            </span>
                            {notification.status === 'unread' && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Unread
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Action buttons */}
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1.5 text-blue-600 hover:text-blue-800"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            ✕
                          </button>
                          
                          {notification.actionUrl && (
                            <a
                              href={notification.actionUrl}
                              className="p-1.5 text-gray-400 hover:text-blue-600"
                              title="Go to"
                            >
                              ↗
                            </a>
                          )}
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