// components/Layout/NotificationBell.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { useNotificationStore } from '../../stores/notificationStore';
import { Bell, Check, X, ExternalLink } from 'lucide-react';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    fetchUnreadCount,
    markAsRead,
    deleteNotification,
    loading 
  } = useNotificationStore();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications({ limit: 10 });
    }
  }, [showDropdown]);
  
  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
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
  
  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (notification.status === 'unread') {
      await markAsRead(notification._id);
    }
    
    // Navigate if actionUrl exists
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    setShowDropdown(false);
  };
  
  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    await markAsRead(id);
  };
  
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      // Implement mark all as read
                      setShowDropdown(false);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  to="/notifications"
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={() => setShowDropdown(false)}
                >
                  View all
                </Link>
              </div>
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900">No notifications</p>
                <p className="text-sm text-gray-600 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      notification.status === 'unread' ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-lg">
                          {getTypeIcon(notification.type)}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Unread indicator */}
                          {notification.status === 'unread' && (
                            <div className="flex-shrink-0">
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        
                        {/* Meta info */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.createdAt)}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {/* Mark as read button */}
                            {notification.status === 'unread' && (
                              <button
                                onClick={(e) => handleMarkAsRead(e, notification._id)}
                                className="text-xs text-blue-600 hover:text-blue-800 p-1"
                                title="Mark as read"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            
                            {/* Delete button */}
                            <button
                              onClick={(e) => handleDelete(e, notification._id)}
                              className="text-xs text-gray-400 hover:text-red-600 p-1"
                              title="Delete"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            {/* External link icon if actionUrl exists */}
                            {notification.actionUrl && (
                              <ExternalLink className="w-3 h-3 text-gray-400" />
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
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <Link
                to="/notifications"
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setShowDropdown(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;