// src/components/Layout/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { useRequestStore } from "../../stores/requestStore";
import { useStudentStore } from "../../stores/studentStore";
import { useCourseStore } from "../../stores/courseStore";
import { usePaymentStore } from "../../stores/paymentStore";
import { useInstructorStore } from "../../stores/instructorStore";
import api from "../../services/api";
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
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  FileText,
  FolderTree,
  Landmark,
  Heart,
  BarChart3,
  Briefcase,
  Plus,
  GraduationCap,
  Calendar,
  UserPlus,
  CalendarDays,
  BarChart3 as Analytics,
  ClipboardList
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Menu collapse states
  const [showFinanceMenu, setShowFinanceMenu] = useState(false);
  const [showIncomeMenu, setShowIncomeMenu] = useState(false);
  const [showExpenseMenu, setShowExpenseMenu] = useState(false);
  const [showReportsMenu, setShowReportsMenu] = useState(false);
  const [showDirectorsMenu, setShowDirectorsMenu] = useState(false);
  
  const { unreadCount } = useNotificationStore();
  const { todayCount } = useRequestStore();
  const { studentCount, startPolling: startStudentPolling, stopPolling: stopStudentPolling } = useStudentStore();
  const {
    courseCount,
    startPolling: startCoursePolling,
    stopPolling: stopCoursePolling,
  } = useCourseStore();
  const {
    instructorCount,
    startPolling: startInstructorPolling,
    stopPolling: stopInstructorPolling,
  } = useInstructorStore();
  
  // Instructor-specific counts
  const [myCoursesCount, setMyCoursesCount] = useState(0);
  const [totalStudentsForInstructor, setTotalStudentsForInstructor] = useState(0);
  
  const { 
    fetchOutstandingReport,
    outstandingReport,
  } = usePaymentStore();

  // Fetch outstanding report on mount and periodically
  useEffect(() => {
    if (["admin", "receptionist"].includes(user?.role)) {
      fetchOutstandingReport();
      
      const interval = setInterval(fetchOutstandingReport, 300000);
      return () => clearInterval(interval);
    }
  }, [user?.role, fetchOutstandingReport]);

  // Fetch instructor-specific counts
  useEffect(() => {
    if (user?.role === 'instructor') {
      const fetchInstructorData = async () => {
        try {
          const response = await api.get('/courses?instructor=true');
          const courses = response.data.data || [];
          setMyCoursesCount(courses.length);
          
          const total = courses.reduce((sum, course) => 
            sum + (course.enrolledStudents?.length || 0), 0);
          setTotalStudentsForInstructor(total);
        } catch (error) {
          console.error('Failed to fetch instructor counts:', error);
        }
      };
      fetchInstructorData();
    }
  }, [user]);

  // Fetch counts when component mounts
  useEffect(() => {
    const initializeCounts = async () => {
      try {
        if (["admin", "instructor", "receptionist"].includes(user?.role)) {
          startCoursePolling();
        }
        if (["admin", "receptionist"].includes(user?.role)) {
          startStudentPolling();
          startInstructorPolling();
        }
      } catch (error) {
        console.warn("Initial count fetch failed:", error);
      }
    };

    initializeCounts();

    return () => {
      stopCoursePolling();
      stopStudentPolling();
      stopInstructorPolling();
    };
  }, [user?.role, startCoursePolling, stopCoursePolling, startStudentPolling, stopStudentPolling, startInstructorPolling, stopInstructorPolling]);

  // Helper function to format large numbers for display
  const formatBadgeCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count;
  };

  // Check if a path is active
  const isActive = (path) => location.pathname === path;
  const isPathStartsWith = (paths) => paths.some(path => location.pathname.startsWith(path));

  // ==================== NAVIGATION BASED ON ROLE ====================
  
  // 1. DASHBOARD - Always first
  const dashboardNav = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "receptionist", "student", "parent", "instructor"],
    },
  ];

  // 2. VISITOR REQUESTS - Right after Dashboard
  const visitorRequestsNav = [
    {
      name: "Visitor Requests",
      href: "/requests",
      icon: ClipboardList,
      roles: ["admin", "receptionist"],
      badgeCount: todayCount || 0,
    },
  ];

  // 3. ACADEMIC MANAGEMENT - Different for instructors vs admin
  const academicNavigation = user?.role === "instructor" ? [
    {
      name: "My Students",
      href: "/students",
      icon: GraduationCap,
      roles: ["instructor"],
      badgeCount: totalStudentsForInstructor || 0,
    },
    {
      name: "My Courses",
      href: "/courses",
      icon: BookOpen,
      roles: ["instructor"],
      badgeCount: myCoursesCount || 0,
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: ClipboardCheck,
      roles: ["instructor"],
    },
    {
      name: "Grades",
      href: "/grades",
      icon: Award,
      roles: ["instructor"],
    },
    {
      name: "Events",
      href: "/events",
      icon: CalendarDays,
      roles: ["instructor"],
    },
  ] : [
    // Admin/Receptionist view
    {
      name: "Students",
      href: "/students",
      icon: GraduationCap,
      roles: ["admin", "receptionist"],
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
      name: "Instructors",
      href: "/instructors",
      icon: UserPlus,
      roles: ["admin", "receptionist"],
      badgeCount: instructorCount || 0,
    },
    {
      name: "Events",
      href: "/events",
      icon: CalendarDays,
      roles: ["admin", "receptionist", "instructor", "student", "parent"],
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: Calendar,
      roles: ["admin", "instructor"],
    },
    {
      name: "Grades",
      href: "/grades",
      icon: Award,
      roles: ["admin", "instructor", "student", "parent"],
    },
  ];

  // 4. FINANCIAL MANAGEMENT - Admin only
  const financialNavigation = [
    {
      name: "Fee Management",
      icon: DollarSign,
      roles: ["admin", "receptionist"],
      isOpen: showFinanceMenu,
      setIsOpen: setShowFinanceMenu,
      isActive: () => isPathStartsWith(['/fees']),
      submenu: [
        { name: "Fee Dashboard", href: "/fees", icon: PieChart },
        { name: "Record Payment", href: "/fees/record-payment", icon: CreditCard },
        { name: "Payment History", href: "/fees/history", icon: Receipt },
        { name: "Fee Reports", href: "/fees/reports", icon: FileText },
      ],
    },
    {
      name: "Income",
      icon: TrendingUp,
      roles: ["admin"],
      isOpen: showIncomeMenu,
      setIsOpen: setShowIncomeMenu,
      isActive: () => isPathStartsWith(['/income']),
      submenu: [
        { name: "All Income", href: "/income", icon: TrendingUp },
        { name: "Record Income", href: "/income/record", icon: Plus },
        { name: "Director Investments", href: "/income?sourceType=director_investment", icon: Landmark },
        { name: "Grants & Donations", href: "/income?sourceType=grant,donation", icon: Heart },
        { name: "Income Reports", href: "/income?tab=reports", icon: FileText },
      ],
    },
    {
      name: "Expenses",
      icon: TrendingDown,
      roles: ["admin"],
      isOpen: showExpenseMenu,
      setIsOpen: setShowExpenseMenu,
      isActive: () => isPathStartsWith(['/expenses']),
      submenu: [
        { name: "All Expenses", href: "/expenses", icon: TrendingDown },
        { name: "Record Expense", href: "/expenses/add", icon: Plus },
        { name: "Expense Categories", href: "/expenses/categories", icon: FolderTree },
        { name: "Expense Reports", href: "/expenses?report=true", icon: FileText },
      ],
    },
    {
      name: "Financial Reports",
      icon: BarChart3,
      roles: ["admin"],
      isOpen: showReportsMenu,
      setIsOpen: setShowReportsMenu,
      isActive: () => isPathStartsWith(['/financial-dashboard', '/financial/profit-loss']),
      submenu: [
        { name: "Financial Dashboard", href: "/financial-dashboard", icon: PieChart },
        { name: "Profit & Loss", href: "/financial/profit-loss", icon: TrendingUp },
        { name: "Cash Flow", href: "/financial/cash-flow", icon: Wallet },
        { name: "Budget vs Actual", href: "/financial/budget-vs-actual", icon: FileText },
        { name: "Financial Statements", href: "/financial/statements", icon: Briefcase },
      ],
    },
  ];

  // 5. ADMINISTRATION - Admin only
  const adminNavigation = [
    {
      name: "Directors",
      icon: Landmark,
      roles: ["admin"],
      isOpen: showDirectorsMenu,
      setIsOpen: setShowDirectorsMenu,
      isActive: () => isPathStartsWith(['/directors']),
      submenu: [
        { name: "All Directors", href: "/directors", icon: Users },
        { name: "Add Director", href: "/directors/add", icon: Plus },
        { name: "Director Investments", href: "/directors?tab=investments", icon: TrendingUp },
        { name: "Director Reports", href: "/directors?tab=reports", icon: FileText },
      ],
    },
  ];

  // 6. USER & SETTINGS - Everyone
  const userNavigation = [
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      roles: ["admin", "student", "parent", "receptionist", "instructor"],
    },
  ];

  // Filter navigation based on user role
  const filteredDashboardNav = dashboardNav.filter(item => item.roles.includes(user?.role));
  const filteredVisitorRequestsNav = visitorRequestsNav.filter(item => item.roles.includes(user?.role));
  const filteredAcademicNav = academicNavigation.filter(item => item.roles.includes(user?.role));
  const filteredFinancialNav = financialNavigation.filter(item => item.roles.includes(user?.role));
  const filteredAdminNav = adminNavigation.filter(item => item.roles.includes(user?.role));
  const filteredUserNav = userNavigation.filter(item => item.roles.includes(user?.role));

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "from-red-500 to-pink-600";
      case "receptionist":
        return "from-blue-500 to-purple-600";
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

  // Section Header Component
  const SectionHeader = ({ title }) => (
    <div className="pt-4 pb-2">
      <div className="px-3 py-2">
        <div className="flex items-center space-x-2">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
      </div>
    </div>
  );

  // Render menu item with submenu
  const renderMenuItem = (item) => {
    const IconComponent = item.icon;
    const hasBadge = item.badgeCount > 0;
    const isActiveItem = item.isActive ? item.isActive() : isActive(item.href);

    if (item.submenu) {
      const isOpen = item.isOpen;
      const setIsOpen = item.setIsOpen;
      
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
              isActiveItem
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-l-2 border-blue-600"
                : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:text-gray-900"
            }`}
          >
            <IconComponent className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
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

    // Regular navigation items
    return (
      <Link
        key={item.name}
        to={item.href}
        className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
          isActiveItem
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-r-2 border-blue-600"
            : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:text-gray-900"
        }`}
      >
        <IconComponent className="w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110" />
        <span className="flex-1">{item.name}</span>
        {hasBadge && (
          <span className={`ml-2 h-5 min-w-5 px-1 text-white text-xs rounded-full flex items-center justify-center ${
            item.name === "Visitor Requests" ? "bg-red-500" : "bg-blue-500"
          }`}>
            {formatBadgeCount(item.badgeCount)}
          </span>
        )}
      </Link>
    );
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
            <h1 className="text-lg font-bold text-gray-900">Serian Institute</h1>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-4 flex-1 overflow-y-auto">
        <div className="px-4 space-y-1">
          {/* 1. DASHBOARD */}
          {filteredDashboardNav.map(renderMenuItem)}

          {/* 2. VISITOR REQUESTS */}
          {filteredVisitorRequestsNav.map(renderMenuItem)}

          {/* 3. ACADEMIC MANAGEMENT */}
          {filteredAcademicNav.length > 0 && (
            <>
              <SectionHeader title="Academic Management" />
              {filteredAcademicNav.map(renderMenuItem)}
            </>
          )}

          {/* 4. FINANCIAL MANAGEMENT */}
          {filteredFinancialNav.length > 0 && user?.role !== 'instructor' && (
            <>
              <SectionHeader title="Financial Management" />
              {filteredFinancialNav.map(renderMenuItem)}
            </>
          )}

          {/* 5. ADMINISTRATION */}
          {filteredAdminNav.length > 0 && user?.role !== 'instructor' && (
            <>
              <SectionHeader title="Administration" />
              {filteredAdminNav.map(renderMenuItem)}
            </>
          )}

          {/* 6. USER SECTION */}
          {filteredUserNav.length > 0 && (
            <>
              <SectionHeader title="User" />
              {filteredUserNav.map(renderMenuItem)}
            </>
          )}
        </div>
      </nav>

      {/* User Section at Bottom */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
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
                    <span className="text-white text-xs font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                Notifications
              </span>
            </div>
            {unreadCount > 0 && <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>}
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 group"
          >
            <div className={`h-10 w-10 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(user?.role)} capitalize`}>
                  {user?.role}
                </span>
                <span className="text-xs text-gray-500 truncate">{user?.email}</span>
              </div>
            </div>
            {showUserMenu ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 animate-fadeIn">
              <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors" onClick={() => setShowUserMenu(false)}>
                <User className="w-4 h-4 mr-2" /> My Profile
              </Link>
              <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors" onClick={() => setShowUserMenu(false)}>
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
              <button onClick={() => { logout(); setShowUserMenu(false); }} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;