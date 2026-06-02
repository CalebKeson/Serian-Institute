// src/pages/Courses/Courses.jsx - FIXED SUMMARY DATA

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Building,
  Calendar,
  User,
  BadgeCheck,
  Trash2,
  Car,
  Droplets,
  Zap,
  Cpu,
  Users,
  Award,
  HeartPulse,
  TrendingUp,
  DollarSign
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import CourseTable from "../../components/Courses/CourseTable";
import { useCourseStore } from "../../stores/courseStore";
import { useAuthStore } from "../../stores/authStore";
import ExportButtons from "../../components/Fees/ExportButtons";
import { courseExportConfig } from "../../utils/exportConfigs";
import toast from "react-hot-toast";

const Courses = () => {
  const { user } = useAuthStore();
  const {
    courses,
    loading,
    pagination,
    searchTerm,
    filters,
    fetchCourses,
    deleteCourse,
    setSearchTerm,
    setFilters,
  } = useCourseStore();

  const [localSearch, setLocalSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exportData, setExportData] = useState([]);
  const [exportSummary, setExportSummary] = useState({
    totalCourses: 0,
    activeCourses: 0,
    totalEnrollment: 0,
    totalCapacity: 0,
    utilizationRate: 0,
    totalExpectedRevenue: 0
  });

  const navigate = useNavigate();

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Prepare export data when courses change
  useEffect(() => {
    if (courses.length > 0) {
      prepareExportData();
    }
  }, [courses]);

  // Prepare data for export
  const prepareExportData = () => {
    // Format courses for export - ONLY the columns we want
    const formattedCourses = courses.map(course => ({
      courseCode: course.courseCode || 'N/A',
      courseName: course.name || 'N/A',
      instructor: course.instructor?.name || 'Unassigned',
      enrolledCount: course.enrolledCount || course.enrolledStudents?.length || 0,
      price: course.price || 0,
      certification: course.certification || 'N/A'
    }));

    setExportData(formattedCourses);

    // Calculate summary statistics
    const totalCourses = courses.length;
    const activeCourses = courses.filter(c => c.status === 'active').length;
    const totalEnrollment = courses.reduce((sum, course) => {
      return sum + (course.enrolledCount || course.enrolledStudents?.length || 0);
    }, 0);
    
    // Calculate total capacity
    const totalCapacity = courses.reduce((sum, course) => sum + (course.maxStudents || 0), 0);
    
    // Calculate utilization rate
    const utilizationRate = totalCapacity > 0 ? (totalEnrollment / totalCapacity) * 100 : 0;
    
    // Calculate total expected revenue from active courses
    const totalExpectedRevenue = courses
      .filter(c => c.status === 'active')
      .reduce((sum, course) => {
        const enrolled = course.enrolledCount || course.enrolledStudents?.length || 0;
        return sum + ((course.price || 0) * enrolled);
      }, 0);

    setExportSummary({
      totalCourses,
      activeCourses,
      totalEnrollment,
      totalCapacity,
      utilizationRate: Math.round(utilizationRate),
      totalExpectedRevenue
    });
  };

  const getCourseTypeLabel = (courseType) => {
    const labels = {
      driving: "Driving Classes",
      plumbing: "Plumbing",
      electrical: "Electrical Installation",
      computer: "Computer Packages",
      cna: "Certified Nursing Assistant"
    };
    return labels[courseType] || courseType || 'Unknown';
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
        fetchCourses(1, pagination.limit, localSearch, filters);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, pagination.limit, filters]);

  const handlePageChange = (newPage) => {
    fetchCourses(newPage, pagination.limit, searchTerm, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchCourses(1, pagination.limit, searchTerm, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      courseType: "",
      intakeMonth: "",
      status: "",
      instructor: "",
    };
    setFilters(clearedFilters);
    fetchCourses(1, pagination.limit, searchTerm, clearedFilters);
  };

  const handleViewCourse = (course) => {
    navigate(`/courses/${course._id}`);
  };

  const handleEditCourse = (course) => {
    navigate(`/courses/edit/${course._id}`);
  };

  const handleDeleteCourse = (course) => {
    setDeleteConfirm(course);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteCourse(deleteConfirm._id);
      if (result.success) {
        setDeleteConfirm(null);
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleExport = async (format, options) => {
    toast.success(`Preparing ${format.toUpperCase()} export...`);
    return { success: true };
  };

  // Data options for filters
  const courseTypes = [
    { value: "driving", label: "Driving Classes", icon: Car },
    { value: "plumbing", label: "Plumbing", icon: Droplets },
    { value: "electrical", label: "Electrical", icon: Zap },
    { value: "computer", label: "Computer", icon: Cpu },
    { value: "cna", label: "Nursing Assistant", icon: HeartPulse }
  ];

  const intakeMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const statusOptions = ["active", "inactive", "completed", "cancelled"];

  const calculateStats = () => {
    const totalCourses = pagination.results || 0;
    const activeCourses = courses.filter((c) => c.status === "active").length;
    const totalEnrolled = courses.reduce((total, course) => {
      const enrolledCount = course.enrolledCount || course.enrolledStudents?.length || 0;
      return total + enrolledCount;
    }, 0);
    const uniqueCourseTypes = new Set(courses.map((c) => c.courseType)).size;
    const avgEnrollment = totalCourses > 0 ? Math.round((totalEnrolled / totalCourses) * 10) / 10 : 0;

    return {
      totalCourses,
      activeCourses,
      totalEnrolled,
      uniqueCourseTypes,
      avgEnrollment,
    };
  };

  const stats = calculateStats();

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="w-8 h-8 mr-3 text-purple-600" />
              Course Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all courses and enrollments
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-3">
            {/* Export Button */}
            <ExportButtons
              data={exportData}
              config={courseExportConfig}
              filename="courses_report"
              formats={['csv', 'excel', 'pdf', 'print', 'email']}
              includeDateRange={false}
              buttonStyle="default"
              buttonText="Export Courses"
              customSummaryData={exportSummary}
            />

            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>

            {user?.role === "admin" && (
              <Link
                to="/courses/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BadgeCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.activeCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Enrollment
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEnrolled}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Course Types</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.uniqueCourseTypes}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search courses by code, name, or description..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {Object.values(filters).some((filter) => filter !== "") && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-600 rounded-full">
                    {Object.values(filters).filter((f) => f !== "").length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Type
                  </label>
                  <select
                    value={filters.courseType}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        courseType: e.target.value,
                      })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="">All Course Types</option>
                    {courseTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intake Month
                  </label>
                  <select
                    value={filters.intakeMonth}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        intakeMonth: e.target.value,
                      })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="">All Months</option>
                    {intakeMonths.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange({ ...filters, status: e.target.value })
                    }
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <CourseTable
          courses={courses}
          loading={loading}
          onView={handleViewCourse}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
          currentUser={user}
        />
      </div>

      {/* Pagination */}
      {pagination.total > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page{" "}
            <span className="font-medium">{pagination.current}</span> of{" "}
            <span className="font-medium">{pagination.total}</span> (
            {pagination.results} total courses)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.total}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Delete Course
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete {deleteConfirm.courseCode} -{" "}
                    {deleteConfirm.name}? This action cannot be undone.
                  </p>
                  {deleteConfirm.enrolledStudents?.length > 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      ⚠️ Warning: This course has{" "}
                      {deleteConfirm.enrolledStudents.length} enrolled students!
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Courses;