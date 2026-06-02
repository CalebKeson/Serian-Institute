// src/pages/Students/Students.jsx - FIXED EXPORT DATA

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Trash2,
  UserCheck,
  UserX,
  GraduationCap,
  Award,
  Loader
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import StudentTable from "../../components/Students/StudentTable";
import { useStudentStore } from "../../stores/studentStore";
import { useEnrollmentStore } from "../../stores/enrollmentStore";
import { useAuthStore } from "../../stores/authStore";
import ExportButtons from "../../components/Fees/ExportButtons";
import { studentExportConfig } from "../../utils/exportConfigs";
import toast from "react-hot-toast";

const Students = () => {
  const { user } = useAuthStore();
  const {
    students,
    loading,
    pagination,
    searchTerm,
    fetchStudents,
    deleteStudent,
    setSearchTerm,
  } = useStudentStore();

  const { fetchStudentEnrollments } = useEnrollmentStore();

  const [localSearch, setLocalSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [exportData, setExportData] = useState([]);
  const [exportSummary, setExportSummary] = useState({
    totalStudents: 0,
    activeStudents: 0,
    enrolledStudents: 0,
    notEnrolledStudents: 0,
    graduatedStudents: 0
  });
  const [studentEnrollmentStatus, setStudentEnrollmentStatus] = useState({});
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [exportReady, setExportReady] = useState(false);

  const navigate = useNavigate();

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Fetch enrollment status for each student
  useEffect(() => {
    const fetchEnrollmentStatuses = async () => {
      if (students.length === 0) {
        setExportReady(true);
        return;
      }
      
      setLoadingEnrollments(true);
      const statusMap = {};
      
      // Use Promise.all to fetch all enrollments in parallel
      const promises = students.map(async (student) => {
        try {
          const enrollments = await fetchStudentEnrollments(student._id, 'enrolled');
          const hasEnrollments = enrollments && enrollments.length > 0;
          
          // Get all admission numbers from enrollments
          const admissionNumbers = enrollments
            ?.filter(e => e && e.admissionNumber)
            .map(e => e.admissionNumber) || [];
          
          statusMap[student._id] = {
            hasEnrollments,
            admissionNumbers,
            admissionNumbersDisplay: admissionNumbers.length > 0 ? admissionNumbers.join(', ') : 'None',
            enrolledCourses: enrollments?.length || 0,
            enrollmentStatus: hasEnrollments ? 'Enrolled' : 'Not Enrolled'
          };
        } catch (error) {
          console.error(`Error fetching enrollments for student ${student._id}:`, error);
          statusMap[student._id] = {
            hasEnrollments: false,
            admissionNumbers: [],
            admissionNumbersDisplay: 'None',
            enrolledCourses: 0,
            enrollmentStatus: 'Not Enrolled'
          };
        }
      });
      
      await Promise.all(promises);
      setStudentEnrollmentStatus(statusMap);
      setLoadingEnrollments(false);
      setExportReady(true); // Mark export as ready after enrollment data is loaded
    };

    fetchEnrollmentStatuses();
  }, [students, fetchStudentEnrollments]);

  // Prepare data for export - only when enrollment status is ready
  const prepareExportData = useCallback(() => {
    if (!exportReady || students.length === 0) return;
    
    // Format students for export
    const formattedStudents = students.map(student => {
      const enrollmentInfo = studentEnrollmentStatus[student._id] || {
        hasEnrollments: false,
        admissionNumbers: [],
        admissionNumbersDisplay: 'None',
        enrolledCourses: 0,
        enrollmentStatus: 'Not Enrolled'
      };

      return {
        studentName: student.user?.name || 'N/A',
        studentId: student.studentId || 'Not assigned',
        admissionNumber: enrollmentInfo.admissionNumbersDisplay,
        email: student.user?.email || 'N/A',
        phone: student.phone || 'N/A',
        enrollmentStatus: enrollmentInfo.enrollmentStatus,
        enrolledCourses: enrollmentInfo.enrolledCourses,
        enrollmentDate: student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A',
        status: student.status || 'active',
        gender: student.gender || 'N/A',
        dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'
      };
    });

    setExportData(formattedStudents);

    // Calculate summary statistics
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const graduatedStudents = students.filter(s => s.status === 'graduated').length;
    
    // Count enrolled students (those with at least one enrollment)
    const enrolledStudents = Object.values(studentEnrollmentStatus).filter(
      status => status.hasEnrollments === true
    ).length;
    const notEnrolledStudents = totalStudents - enrolledStudents;

    setExportSummary({
      totalStudents,
      activeStudents,
      enrolledStudents,
      notEnrolledStudents,
      graduatedStudents
    });
  }, [students, studentEnrollmentStatus, exportReady]);

  // Update export data when enrollment status changes
  useEffect(() => {
    if (exportReady && Object.keys(studentEnrollmentStatus).length === students.length) {
      prepareExportData();
    }
  }, [exportReady, studentEnrollmentStatus, students, prepareExportData]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
        fetchStudents(1, pagination.limit, localSearch);
        setExportReady(false); // Reset export ready when fetching new students
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, pagination.limit, fetchStudents]);

  const handlePageChange = (newPage) => {
    fetchStudents(newPage, pagination.limit, searchTerm);
    setExportReady(false); // Reset export ready when changing page
  };

  const handleViewStudent = (student) => {
    navigate(`/students/${student._id}`);
  };

  const handleEditStudent = (student) => {
    navigate(`/students/edit/${student._id}`);
  };

  const handleDeleteStudent = (student) => {
    setDeleteConfirm(student);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteStudent(deleteConfirm._id);
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

  // Calculate dashboard stats
  const dashboardStats = {
    totalStudents: pagination.results || 0,
    activeStudents: students.filter(s => s.status === 'active').length,
    enrolledStudents: Object.values(studentEnrollmentStatus).filter(s => s.hasEnrollments).length,
    notEnrolledStudents: students.length - Object.values(studentEnrollmentStatus).filter(s => s.hasEnrollments).length,
    graduatedStudents: students.filter(s => s.status === 'graduated').length
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Student Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all students at Serian Institute
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-3">
            {/* Export Button - Only enable when data is ready */}
            <ExportButtons
              data={exportData}
              config={studentExportConfig}
              filename="students_report"
              formats={['csv', 'excel', 'pdf', 'print', 'email']}
              includeDateRange={false}
              buttonStyle="default"
              buttonText="Export Students"
              customSummaryData={exportSummary}
              loading={loadingEnrollments || !exportReady}
            />

            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </button>

            {user?.role === "admin" && (
              <Link
                to="/students/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Loading indicator while fetching enrollments */}
      {loadingEnrollments && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center">
          <Loader className="w-4 h-4 mr-2 animate-spin" />
          Loading enrollment data...
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.activeStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.enrolledStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserX className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Not Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.notEnrolledStudents}
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
              <p className="text-sm font-medium text-gray-600">Graduated</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardStats.graduatedStudents}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students by name, ID, or email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <StudentTable
          students={students}
          loading={loading || loadingEnrollments}
          onView={handleViewStudent}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
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
            {pagination.results} total students)
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
                  Delete Student
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete {deleteConfirm.user?.name}?
                    This action cannot be undone.
                  </p>
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

export default Students;