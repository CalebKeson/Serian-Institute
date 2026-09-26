// src/components/Layout/Sidebar.jsx - ALWAYS EXPANDED (NO TOGGLES)

import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
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
  ClipboardList,
  Trophy,
  UserCircle,
  Building2,
  Star,
  MessageSquare,
  Globe,
  Mail,
  Users as UsersIcon,
  Menu,
  X
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  
  // ============ Persistent scroll position storage ============
  const savedScrollPositionRef = useRef(0);
  const isRestoringRef = useRef(false);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // ============ NO TOGGLE STATES - All menus are ALWAYS EXPANDED ============
  // We keep the state variables but they are always true
  // This prevents re-renders from toggling
  const [showFinanceMenu] = useState(true);
  const [showIncomeMenu] = useState(true);
  const [showExpenseMenu] = useState(true);
  const [showReportsMenu] = useState(true);
  const [showDirectorsMenu] = useState(true);
  const [showReferralMenu] = useState(true);
  
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

  // ============ Save scroll position on scroll ============
  const handleScroll = () => {
    if (scrollContainerRef.current && !isRestoringRef.current) {
      savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  };

  // ============ Restore scroll position on mount/render ============
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (savedScrollPositionRef.current > 0) {
      isRestoringRef.current = true;
      container.scrollTop = savedScrollPositionRef.current;
      
      requestAnimationFrame(() => {
        isRestoringRef.current = false;
      });
    }
  }, [location.pathname]);

  // ============ Save scroll position before navigation ============
  const handleNavigation = (path, e) => {
    if (e) e.preventDefault();
    
    if (scrollContainerRef.current) {
      savedScrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
    
    if (location.pathname !== path) {
      navigate(path);
    }
  };

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

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

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

  // 3. ONLINE ENQUIRIES - Admin only
  const onlineEnquiriesNav = [
    {
      name: "Online Enquiries",
      href: "/enquiries",
      icon: MessageSquare,
      roles: ["admin"],
    },
    {
      name: "Enquiry Analytics",
      href: "/enquiry-analytics",
      icon: BarChart3,
      roles: ["admin"],
    },
  ];

  // 4. ACADEMIC MANAGEMENT - Different for instructors vs admin
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

  // 5. REFERRAL MANAGEMENT - Admin only (ALWAYS EXPANDED)
  const referralNavigation = [
    {
      name: "Referrals",
      icon: Trophy,
      roles: ["admin"],
      isOpen: showReferralMenu,
      submenu: [
        { name: "Manage Referrers", href: "/referrers", icon: Users },
        { name: "Referral Report", href: "/referral-report", icon: BarChart3 },
      ],
    },
  ];

  // 6. FINANCIAL MANAGEMENT - Admin only (ALWAYS EXPANDED)
  const financialNavigation = [
    {
      name: "Fee Management",
      icon: DollarSign,
      roles: ["admin", "receptionist"],
      isOpen: showFinanceMenu,
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
      submenu: [
        { name: "Financial Dashboard", href: "/financial-dashboard", icon: PieChart },
        { name: "Profit & Loss", href: "/financial/profit-loss", icon: TrendingUp },
        { name: "Cash Flow", href: "/financial/cash-flow", icon: Wallet },
        { name: "Budget vs Actual", href: "/financial/budget-vs-actual", icon: FileText },
        { name: "Financial Statements", href: "/financial/statements", icon: Briefcase },
      ],
    },
  ];

  // 7. ADMINISTRATION - Admin only (ALWAYS EXPANDED)
  const adminNavigation = [
    {
      name: "Users",
      href: "/users",
      icon: UsersIcon,
      roles: ["admin"],
    },
    {
      name: "Directors",
      icon: Landmark,
      roles: ["admin"],
      isOpen: showDirectorsMenu,
      submenu: [
        { name: "All Directors", href: "/directors", icon: Users },
        { name: "Add Director", href: "/directors/add", icon: Plus },
        { name: "Director Investments", href: "/directors?tab=investments", icon: TrendingUp },
        { name: "Director Reports", href: "/directors?tab=reports", icon: FileText },
      ],
    },
  ];

  // 8. USER & SETTINGS - Everyone
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
  const filteredOnlineEnquiriesNav = onlineEnquiriesNav.filter(item => item.roles.includes(user?.role));
  const filteredAcademicNav = academicNavigation.filter(item => item.roles.includes(user?.role));
  const filteredReferralNav = referralNavigation.filter(item => item.roles.includes(user?.role));
  const filteredFinancialNav = financialNavigation.filter(item => item.roles.includes(user?.role));
  const filteredAdminNav = adminNavigation.filter(item => item.roles.includes(user?.role));
  const filteredUserNav = userNavigation.filter(item => item.roles.includes(user?.role));

  // Memoize filtered nav items to prevent unnecessary re-renders
  const navItems = useMemo(() => ({
    dashboard: filteredDashboardNav,
    visitor: filteredVisitorRequestsNav,
    onlineEnquiries: filteredOnlineEnquiriesNav,
    academic: filteredAcademicNav,
    referral: filteredReferralNav,
    financial: filteredFinancialNav,
    admin: filteredAdminNav,
    user: filteredUserNav
  }), [
    filteredDashboardNav,
    filteredVisitorRequestsNav,
    filteredOnlineEnquiriesNav,
    filteredAcademicNav,
    filteredReferralNav,
    filteredFinancialNav,
    filteredAdminNav,
    filteredUserNav
  ]);

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
        return "bg-red-500/20 text-red-400";
      case "receptionist":
        return "bg-blue-500/20 text-blue-400";
      case "instructor":
        return "bg-purple-500/20 text-purple-400";
      case "student":
        return "bg-indigo-500/20 text-indigo-400";
      case "parent":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Section Header Component - COMPACT SINGLE LINE (Without toggle)
  const SectionHeader = ({ title, icon: Icon }) => (
    <div className="px-3 py-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/10"></div>
        {Icon && <Icon className="w-3 h-3 text-gray-500 flex-shrink-0" />}
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
          {title}
        </span>
        <div className="h-px flex-1 bg-white/10"></div>
      </div>
    </div>
  );

  // ============ Render menu item - ALWAYS EXPANDED (NO TOGGLE BUTTONS) ============
  const renderMenuItem = (item) => {
    const IconComponent = item.icon;
    const hasBadge = item.badgeCount > 0;
    const isActiveItem = item.isActive ? item.isActive() : isActive(item.href);

    if (item.submenu) {
      // Always expanded - show submenu items directly without toggle
      return (
        <div key={item.name} className="space-y-0.5">
          {/* Section header without toggle button */}
          <div className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActiveItem
              ? "bg-white/10 text-white shadow-lg shadow-white/5"
              : "text-gray-400"
          }`}>
            <IconComponent className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
            <span className="flex-1">{item.name}</span>
          </div>

          {/* Submenu items always visible */}
          <div className="ml-3 pl-3 border-l border-white/10 space-y-0.5">
            {item.submenu.map((subItem) => {
              const SubIcon = subItem.icon;
              const isSubActive = isActive(subItem.href);
              return (
                <Link
                  key={subItem.href}
                  to={subItem.href}
                  replace={location.pathname === subItem.href}
                  onClick={(e) => handleNavigation(subItem.href, e)}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isSubActive
                      ? "bg-white/10 text-white"
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5 mr-3 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
                  <span className="flex-1 text-xs">{subItem.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      );
    }

    // Regular link
    return (
      <Link
        key={item.name}
        to={item.href}
        replace={location.pathname === item.href}
        onClick={(e) => handleNavigation(item.href, e)}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
          isActiveItem
            ? "bg-white/10 text-white shadow-lg shadow-white/5"
            : "text-gray-400 hover:text-white hover:bg-white/10"
        }`}
      >
        <IconComponent className="w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110 flex-shrink-0" />
        <span className="flex-1">{item.name}</span>
        {hasBadge && (
          <span className={`ml-2 h-5 min-w-5 px-1.5 text-white text-[10px] font-medium rounded-full flex items-center justify-center ${
            item.name === "Visitor Requests" ? "bg-red-500/80" : "bg-blue-500/80"
          }`}>
            {formatBadgeCount(item.badgeCount)}
          </span>
        )}
      </Link>
    );
  };

  // Mobile Toggle Button
  const MobileToggle = () => (
    <button
      onClick={() => setIsMobileOpen(!isMobileOpen)}
      className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800/90 backdrop-blur-sm rounded-lg text-white hover:bg-gray-700 transition-colors border border-white/10"
    >
      {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );

  // Sidebar Content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <span className="text-white font-bold text-sm">SI</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-white truncate">Serian Institute</h1>
            <p className="text-xs text-gray-400 capitalize truncate">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu - ALL SUB-MENUS ALWAYS EXPANDED */}
      <nav 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2 px-3 custom-scrollbar"
      >
        <div className="space-y-0.5">
          {/* 1. DASHBOARD */}
          {navItems.dashboard.map(renderMenuItem)}

          {/* 2. VISITOR REQUESTS */}
          {navItems.visitor.map(renderMenuItem)}

          {/* 3. ONLINE ENQUIRIES */}
          {navItems.onlineEnquiries.length > 0 && (
            <>
              <SectionHeader title="Enquiries" icon={MessageSquare} />
              {navItems.onlineEnquiries.map(renderMenuItem)}
            </>
          )}

          {/* 4. ACADEMIC MANAGEMENT */}
          {navItems.academic.length > 0 && (
            <>
              <SectionHeader title="Academic Management" icon={BookOpen} />
              {navItems.academic.map(renderMenuItem)}
            </>
          )}

          {/* 5. REFERRAL MANAGEMENT */}
          {navItems.referral.length > 0 && (
            <>
              <SectionHeader title="Referral Management" icon={Trophy} />
              {navItems.referral.map(renderMenuItem)}
            </>
          )}

          {/* 6. FINANCIAL MANAGEMENT */}
          {navItems.financial.length > 0 && user?.role !== 'instructor' && (
            <>
              <SectionHeader title="Financial Management" icon={DollarSign} />
              {navItems.financial.map(renderMenuItem)}
            </>
          )}

          {/* 7. ADMINISTRATION */}
          {navItems.admin.length > 0 && user?.role !== 'instructor' && (
            <>
              <SectionHeader title="Administration" icon={Settings} />
              {navItems.admin.map(renderMenuItem)}
            </>
          )}

          {/* 8. USER SECTION */}
          {navItems.user.length > 0 && (
            <>
              <SectionHeader title="User" icon={User} />
              {navItems.user.map(renderMenuItem)}
            </>
          )}
        </div>
      </nav>

      {/* User Section at Bottom */}
      <div className="p-3 border-t border-white/10 bg-white/5 flex-shrink-0">
        <div className="mb-2 px-2">
          <Link
            to="/notifications"
            className="flex items-center justify-between p-2 rounded-lg hover:bg-white/10 transition-colors group"
          >
            <div className="flex items-center">
              <div className="relative">
                <Bell className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-white text-[10px] font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  </span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-400 group-hover:text-white transition-colors">
                Notifications
              </span>
            </div>
            {unreadCount > 0 && <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse"></span>}
          </Link>
        </div>

        {/* User Profile Card */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center space-x-3 p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
          >
            <div className={`h-9 w-9 bg-gradient-to-r ${getRoleColor(user?.role)} rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 flex-shrink-0`}>
              <span className="text-white font-bold text-sm">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getRoleBadgeColor(user?.role)} capitalize`}>
                  {user?.role}
                </span>
              </div>
            </div>
            {showUserMenu ? (
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          {showUserMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-white/10 py-1 z-10 shadow-xl">
              <Link 
                to="/profile" 
                className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-lg mx-1"
                onClick={() => setShowUserMenu(false)}
              >
                <UserCircle className="w-4 h-4 mr-2" /> My Profile
              </Link>
              <Link 
                to="/settings" 
                className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors rounded-lg mx-1"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Link>
              <div className="border-t border-white/10 my-1 mx-2"></div>
              <button 
                onClick={() => { logout(); setShowUserMenu(false); }} 
                className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors rounded-lg mx-1"
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============ CUSTOM DARK SCROLLBAR STYLES ============ */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <MobileToggle />

      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen flex-shrink-0 sticky top-0 h-screen overflow-hidden shadow-2xl shadow-black/20">
        <SidebarContent />
      </div>

      {/* Sidebar - Mobile Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          ></div>
          <div className="absolute top-0 left-0 w-72 h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl shadow-black/50 animate-slideInRight overflow-hidden">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Sidebar;