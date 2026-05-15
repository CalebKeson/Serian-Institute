// src/App.jsx
import React, { useEffect } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./stores/authStore";
import { useNotificationStore } from "./stores/notificationStore";
import { useRequestStore } from "./stores/requestStore";
import { useStudentStore } from "./stores/studentStore";

// Auth Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// Student Components
import Students from "./components/Students/Students";
import AddStudent from "./components/Students/AddStudent";
import EditStudent from "./components/Students/EditStudent";
import StudentProfile from "./components/Students/StudentProfile";

// Course Components
import Courses from "./components/Courses/Courses";
import AddCourse from "./components/Courses/AddCourse";
import EditCourse from "./components/Courses/EditCourse";
import CourseDetails from "./components/Courses/CourseDetails";
import CourseEnrollments from "./components/Courses/CourseEnrollments";

// Instructor Components
import Instructors from "./components/Instructors/Instructors";
import AddInstructor from "./components/Instructors/AddInstructor";
import EditInstructor from "./components/Instructors/EditInstructor";
import InstructorProfile from "./components/Instructors/InstructorProfile";

// Instructor Fee Views (Read-only)
import CourseFeeDetails from "./pages/Instructor/CourseFeeDetails";
import StudentFeeDetails from "./pages/Instructor/StudentFeeDetails";

// Event Components
import Events from "./pages/Events/Events";
import AddEvent from "./pages/Events/AddEvent";
import EditEvent from "./pages/Events/EditEvent";
import EventDetails from "./pages/Events/EventDetails";

// Grades Components
import GradesOverview from "./pages/Grades/GradesOverview";

// Attendance Components
import CourseAttendance from "./components/Attendance/CourseAttendance";
import AttendanceCourseSelection from "./pages/Attendance/AttendanceCourseSelection";

// Fee Components
import Fees from "./components/Fees/Fees";
import StudentFees from "./components/Fees/StudentFees";
import CourseFees from "./components/Fees/CourseFees";
import RecordPayment from "./components/Fees/RecordPayment";
import PaymentHistory from "./components/Fees/PaymentHistory";
import FeeReports from "./components/Fees/FeeReports";

// Financial Module Imports
import Directors from "./pages/Directors/Directors";
import AddDirector from "./pages/Directors/AddDirector";
import EditDirector from "./pages/Directors/EditDirector";
import DirectorDetails from "./pages/Directors/DirectorDetails";
import FinancialStatements from "./pages/Financial/FinancialStatements";

import Expenses from "./pages/Expenses/Expenses";
import AddExpense from "./pages/Expenses/AddExpense";
import EditExpense from "./pages/Expenses/EditExpense";
import ExpenseDetails from "./pages/Expenses/ExpenseDetails";
import ExpenseCategories from "./pages/Expenses/Categories";

import Income from "./pages/Income/Income";
import RecordIncome from "./pages/Income/RecordIncome";
import EditIncome from "./pages/Income/EditIncome";
import IncomeDetails from "./pages/Income/IncomeDetails";

import FinancialDashboard from "./pages/Financial/FinancialDashboard";
import ProfitLoss from "./pages/Reports/ProfitLoss";
import CashFlow from "./pages/Reports/CashFlow";
import BudgetVsActual from "./pages/Reports/BudgetVsActual";

// Other pages
import Requests from "./pages/Requests/Requests";
import RequestDetails from "./components/Requests/RequestDetails";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import Notifications from "./pages/Notifications/Notifications";

// Scroll to Top Component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname]);

  return null;
};

// Layout wrapper that includes ScrollToTop
const AppLayout = () => {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Public Route component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Role-based Route component
const RoleRoute = ({ children, allowedRoles = [] }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRouter = () => {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);

  const { startPolling, stopPolling } = useNotificationStore();
  const { startPolling: startRequestPolling, stopPolling: stopRequestPolling } =
    useRequestStore();
  const { startPolling: startStudentPolling, stopPolling: stopStudentPolling } =
    useStudentStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      startPolling();
      startRequestPolling();

      if (["admin", "instructor", "receptionist"].includes(user.role)) {
        startStudentPolling();
      } else {
        stopStudentPolling();
      }
    } else {
      stopPolling();
      stopRequestPolling();
      stopStudentPolling();
    }

    return () => {
      stopPolling();
      stopRequestPolling();
      stopStudentPolling();
    };
  }, [user]);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<AppLayout />}>
        {/* ============= PUBLIC ROUTES ============= */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* ============= DASHBOARD ============= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ============= STUDENT MANAGEMENT ============= */}
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor", "receptionist"]}>
                <Students />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/add"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <AddStudent />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <EditStudent />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* ============= COURSE MANAGEMENT ============= */}
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <Courses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/add"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <AddCourse />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <EditCourse />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id"
          element={
            <ProtectedRoute>
              <CourseDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id/enrollments"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor", "receptionist"]}>
                <CourseEnrollments />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:id/attendance"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <CourseAttendance />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "instructor"]}>
                <AttendanceCourseSelection />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ============= INSTRUCTOR MANAGEMENT ============= */}
        <Route
          path="/instructors"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <Instructors />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructors/add"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <AddInstructor />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructors/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <EditInstructor />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructors/:id"
          element={
            <ProtectedRoute>
              <InstructorProfile />
            </ProtectedRoute>
          }
        />

        {/* ============= INSTRUCTOR FEE VIEWS (READ-ONLY) ============= */}
        <Route
          path="/instructor/courses/:courseId/fees"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["instructor"]}>
                <CourseFeeDetails />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructor/students/:studentId/fees"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["instructor"]}>
                <StudentFeeDetails />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ============= EVENT MANAGEMENT ============= */}
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/add"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <AddEvent />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <EditEvent />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id"
          element={
            <ProtectedRoute>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        {/* ============= GRADES MANAGEMENT ============= */}
        <Route
          path="/grades"
          element={
            <ProtectedRoute>
              <RoleRoute
                allowedRoles={["admin", "instructor", "student", "parent"]}
              >
                <GradesOverview />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ============= FEE MANAGEMENT ============= */}
        <Route
          path="/fees"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <Fees />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/student/:studentId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <StudentFees />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/course/:courseId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <CourseFees />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/record-payment"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <RecordPayment />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/history"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <PaymentHistory />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/reports"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin", "receptionist"]}>
                <FeeReports />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ============= FINANCIAL MODULE ============= */}

        {/* Financial Dashboard */}
        <Route
          path="/financial-dashboard"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <FinancialDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial/statements"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <FinancialStatements />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Director Routes */}
        <Route
          path="/directors"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <Directors />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/directors/add"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <AddDirector />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/directors/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <EditDirector />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/directors/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <DirectorDetails />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Expense Routes */}
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <Expenses />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/add"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <AddExpense />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <EditExpense />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <ExpenseDetails />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses/categories"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <ExpenseCategories />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Income Routes */}
        <Route
          path="/income"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <Income />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/income/record"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <RecordIncome />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/income/edit/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <EditIncome />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/income/:id"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <IncomeDetails />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* Financial Report Routes */}
        <Route
          path="/financial/profit-loss"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <ProfitLoss />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial/cash-flow"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <CashFlow />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financial/budget-vs-actual"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["admin"]}>
                <BudgetVsActual />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ============= REQUEST MANAGEMENT ============= */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:id"
          element={
            <ProtectedRoute>
              <RequestDetails />
            </ProtectedRoute>
          }
        />

        {/* ============= USER PROFILE & SETTINGS ============= */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* ============= DEFAULT REDIRECTS ============= */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>,
    ),
  );

  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            theme: {
              primary: "green",
              secondary: "black",
            },
          },
        }}
      />
    </>
  );
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppRouter />
    </div>
  );
}

export default App;