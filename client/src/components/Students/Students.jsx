// src/pages/Students/Students.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import StudentTable from "../../components/Students/StudentTable";
import { useStudentStore } from "../../stores/studentStore";
import { useAuthStore } from "../../stores/authStore";
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

  const [localSearch, setLocalSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
        fetchStudents(1, pagination.limit, localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, pagination.limit]);

  const handlePageChange = (newPage) => {
    fetchStudents(newPage, pagination.limit, searchTerm);
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

          {user?.role === "admin" && (
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <Link
                to="/students/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Student
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Students
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {pagination.results || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                New This Month
              </p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Graduated</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter((s) => s.status === "graduated").length}
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
          loading={loading}
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
            <span className="font-medium">{pagination.total}</span>
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
