// src/components/Layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { useRequestStore } from "../../stores/requestStore";
import { useStudentStore } from "../../stores/studentStore";
import { useCourseStore } from "../../stores/courseStore";
import { usePaymentStore } from "../../stores/paymentStore";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  User,
  LogOut,
  Bell,
  Settings,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Receipt,
  CreditCard,
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeesMenu, setShowFeesMenu] = useState(false);
  const { unreadCount } = useNotificationStore();
  const { todayCount } = useRequestStore();
  const { studentCount, fetchStudentCount } = useStudentStore();
  const {
    courseCount,
    startPolling: startCoursePolling,
    stopPolling: stopCoursePolling,
    fetchCourseCount
  } = useCourseStore();
  
  const { 
    fetchOutstandingReport,
    outstandingReport,
    loading 
  } = usePaymentStore();

  // FIXED: Immediate fetch on mount and after user actions
  useEffect(() => {
    const loadInitialData = async () => {
      if (["admin", "receptionist", "instructor"].includes(user?.role)) {
        // Fetch all counts immediately
        await Promise.all([
          fetchStudentCount(),
          fetchCourseCount(),
          fetchOutstandingReport()
        ]);
        
        // Start polling for real-time updates
        startCoursePolling();
        
        // Set up event listeners for real-time updates
        window.addEventListener('student-enrolled', handleDataChange);
        window.addEventListener('payment-recorded', handleDataChange);
        window.addEventListener('course-created', handleDataChange);
      }
    };

    loadInitialData();

    return () => {
      stopCoursePolling();
      window.removeEventListener('student-enrolled', handleDataChange);
      window.removeEventListener('payment-recorded', handleDataChange);
      window.removeEventListener('course-created', handleDataChange);
    };
  }, [user?.role]);

  // FIXED: Handler for real-time updates
  const handleDataChange = async () => {
    if (["admin", "receptionist", "instructor"].includes(user?.role)) {
      await Promise.all([
        fetchStudentCount(),
        fetchCourseCount(),
        fetchOutstandingReport()
      ]);
    }
  };

  // FIXED: Poll every 30 seconds instead of 5 minutes
  useEffect(() => {
    if (["admin", "receptionist", "instructor"].includes(user?.role)) {
      const interval = setInterval(async () => {
        if (document.visibilityState === 'visible') {
          await Promise.all([
            fetchStudentCount(),
            fetchCourseCount(),
            fetchOutstandingReport()
          ]);
        }
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.role]);

  // Helper function to format large numbers for display
  const formatBadgeCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  // Format currency for badge
  const formatOutstandingBadge = (amount) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}k`;
    }
    return amount;
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "receptionist", "teacher", "student", "parent"],
    },
    {
      name: "Visitor Requests",
      href: "/requests",
      icon: Users,
      roles: ["admin", "receptionist"],
      badgeCount: todayCount || 0,
    },
    {
      name: "Students",
      href: "/students",
      icon: Users,
      roles: ["admin", "instructor", "receptionist"],
      badgeCount: studentCount || 0,
    },
    {
      name: "Courses",
      href: "/courses",
      icon: BookOpen,
      roles: ["admin", "instructor", "receptionist"],
      badgeCount: courseCount || 0,
    },
    {
      name: "Fees & Payments",
      icon: DollarSign,
      roles: ["admin", "receptionist"],
      submenu: [
        {
          name: "Overview",
          href: "/fees",
          icon: DollarSign,
        },
        {
          name: "Record Payment",
          href: "/fees/record-payment",
          icon: CreditCard,
        },
        {
          name: "Payment History",
          href: "/fees/history",
          icon: Receipt,
        },
        {
          name: "Fee Reports",
          href: "/fees/reports",
          icon: Award,
        },
      ],
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: ClipboardCheck,
      roles: ["admin", "instructor"],
    },
    {
      name: "Grades",
      href: "/grades",
      icon: Award,
      roles: ["admin", "instructor", "student", "parent"],
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      roles: [
        "admin",
        "teacher",
        "student",
        "parent",
        "receptionist",
        "instructor",
      ],
    },
  ];

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role)
  );

  const isActive = (path) => location.pathname === path;
  
  const isFeesActive = () => {
    return location.pathname.startsWith('/fees');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "from-red-500 to-pink-600";
      case "receptionist":
        return "from-blue-500 to-purple-600";
      case "teacher":
        return "from-green-500 to-teal-600";
      case "instructor":
        return "from-purple-500 to-indigo-600";
      case "student":
        return "from-indigo-500 to-blue-600";
      case "parent":
        return "from-purple-500 to-indigo-600";
      default:
        return "from-blue-500 to-indigo-600";
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "receptionist":
        return "bg-blue-100 text-blue-800";
      case "teacher":
        return "bg-green-100 text-green-800";
      case "instructor":
        return "bg-purple-100 text-purple-800";
      case "student":
        return "bg-indigo-100 text-indigo-800";
      case "parent":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Serian Institute
            </h1>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 overflow-y-auto">
        <div className="px-4 space-y-2">
          {filteredNavigation.map((item) => {
            const IconComponent = item.icon;
            const hasBadge = item.badgeCount > 0;
            const isStudentItem = item.name === "Students";
            const isCourseItem = item.name === "Courses";

            // Handle items with submenus (Fees)
            if (item.submenu) {
              const isFeesActiveFlag = isFeesActive();
              
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => setShowFeesMenu(!showFeesMenu)}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                      isFeesActiveFlag
                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-2 border-blue-600"
                        : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:text-gray-900"
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                    <span className="flex-1 text-left">{item.name}</span>
                    
                    {/* FIXED: Show outstanding badge with real-time data */}
                    {outstandingReport?.summary?.totalOutstanding > 0 && (
                      <span className="ml-2 h-5 min-w-5 px-1 text-white text-xs rounded-full bg-orange-500 flex items-center justify-center">
                        {formatOutstandingBadge(outstandingReport.summary.totalOutstanding)}
                      </span>
                    )}
                    
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      showFeesMenu ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Submenu Items */}
                  {showFeesMenu && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-1">
                      {item.submenu.map((subItem) => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                              isActive(subItem.href)
                                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700"
                                : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:text-gray-900"
                            }`}
                          >
                            <SubIcon className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110" />
                            <span className="flex-1">{subItem.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular navigation items (no submenu)
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:text-gray-900"
                }`}
              >
                <IconComponent className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
                <span className="flex-1">{item.name}</span>

                {/* Badge for counts - FIXED: Shows real-time data */}
                {hasBadge && (
                  <span
                    className={`ml-2 h-5 min-w-5 px-1 text-white text-xs rounded-full flex items-center justify-center ${
                      isStudentItem
                        ? "bg-blue-500"
                        : isCourseItem
                          ? "bg-purple-500"
                          : "bg-red-500"
                    }`}
                  >
                    {formatBadgeCount(item.badgeCount)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        {/* Notifications Badge */}
        <div className="mb-3 px-3">
          <Link
            to="/notifications"
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 group transition-colors"
          >
            <div className="flex items-center">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                Notifications
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
          >
            <div
              className={`h-10 w-10 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
            >
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(user?.role)} capitalize`}
                >
                  {user?.role}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {user?.email}
                </span>
              </div>
            </div>
            {showUserMenu ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 animate-fadeIn">
              <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4 mr-2" />
                My Profile
              </Link>
              <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;