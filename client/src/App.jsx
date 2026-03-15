import React, { useEffect } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  Navigate,
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

// Grades Components
import GradesOverview from "./pages/Grades/GradesOverview";

// Attendance Components
import CourseAttendance from "./components/Attendance/CourseAttendance";
import AttendanceCourseSelection from './pages/Attendance/AttendanceCourseSelection';

// ============= NEW FEE PAGES IMPORTS =============
import Fees from "./components/Fees/Fees";
import StudentFees from "./components/Fees/StudentFees";
import CourseFees from "./components/Fees/CourseFees";
import RecordPayment from "./components/Fees/RecordPayment";
import PaymentHistory from "./components/Fees/PaymentHistory";
import FeeReports from "./components/Fees/FeeReports";

// Other pages
import Requests from "./components/Requests/Requests";
import RequestDetails from "./components/Requests/RequestDetails";
import Profile from "./pages/Profile/Profile";
import Settings from "./pages/Settings/Settings";
import Notifications from "./pages/Notifications/Notifications";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  return user ? children : <Navigate to="/login" />;
};

// Public Route component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  return !user ? children : <Navigate to="/dashboard" />;
};

// Role-based Route component
const RoleRoute = ({ children, allowedRoles = [] }) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
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
      <Route>
        {/* Public Routes */}
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

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ============= STUDENT MANAGEMENT ROUTES ============= */}
        <Route
          path="/students"
          element={
            <RoleRoute allowedRoles={["admin", "instructor", "receptionist"]}>
              <Students />
            </RoleRoute>
          }
        />
        <Route
          path="/students/add"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <AddStudent />
            </RoleRoute>
          }
        />
        <Route
          path="/students/edit/:id"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <EditStudent />
            </RoleRoute>
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

        {/* ============= COURSE MANAGEMENT ROUTES ============= */}
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
            <RoleRoute allowedRoles={["admin", "instructor"]}>
              <AddCourse />
            </RoleRoute>
          }
        />
        <Route
          path="/courses/edit/:id"
          element={
            <RoleRoute allowedRoles={["admin", "instructor"]}>
              <EditCourse />
            </RoleRoute>
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
            <RoleRoute allowedRoles={["admin", "instructor", "receptionist"]}>
              <CourseEnrollments />
            </RoleRoute>
          }
        />
        <Route
          path="/courses/:id/attendance"
          element={
            <RoleRoute allowedRoles={["admin", "instructor"]}>
              <CourseAttendance />
            </RoleRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <RoleRoute allowedRoles={["admin", "instructor"]}>
              <AttendanceCourseSelection />
            </RoleRoute>
          }
        />

        {/* ============= GRADES MANAGEMENT ROUTES ============= */}
        <Route
          path="/grades"
          element={
            <RoleRoute allowedRoles={["admin", "instructor", "student", "parent"]}>
              <GradesOverview />
            </RoleRoute>
          }
        />

        {/* ============= NEW FEE MANAGEMENT ROUTES ============= */}
        
        {/* Main Fees Dashboard */}
        <Route
          path="/fees"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <Fees />
            </RoleRoute>
          }
        />

        {/* Student-specific Fee Views */}
        <Route
          path="/fees/student/:studentId"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <StudentFees />
            </RoleRoute>
          }
        />

        {/* Course-specific Fee Views */}
        <Route
          path="/fees/course/:courseId"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <CourseFees />
            </RoleRoute>
          }
        />

        {/* Record Payment Page */}
        <Route
          path="/fees/record-payment"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <RecordPayment />
            </RoleRoute>
          }
        />

        {/* Payment History */}
        <Route
          path="/fees/history"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <PaymentHistory />
            </RoleRoute>
          }
        />

        {/* Fee Reports */}
        <Route
          path="/fees/reports"
          element={
            <RoleRoute allowedRoles={["admin", "receptionist"]}>
              <FeeReports />
            </RoleRoute>
          }
        />

        {/* ============= REQUEST MANAGEMENT ROUTES ============= */}
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
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>,
    )
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