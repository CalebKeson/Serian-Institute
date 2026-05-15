// frontend/src/pages/Instructors/Instructors.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Trash2,
  DollarSign,
  Briefcase,
  UserCheck,
  UserX
} from "lucide-react";
import Layout from "../../components/Layout/Layout";
import InstructorTable from "../../components/Instructors/InstructorTable";
import SalaryPaymentModal from "../../components/Instructors/SalaryPaymentModal";
import { useInstructorStore } from "../../stores/instructorStore";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

const Instructors = () => {
  const { user } = useAuthStore();
  const {
    instructors,
    loading,
    pagination,
    searchTerm,
    instructorStats,
    fetchInstructors,
    deleteInstructor,
    fetchInstructorStats,
    setSearchTerm,
  } = useInstructorStore();

  const [localSearch, setLocalSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const navigate = useNavigate();

  // Fetch instructors on component mount
  useEffect(() => {
    fetchInstructors();
    fetchInstructorStats();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        setSearchTerm(localSearch);
        fetchInstructors(1, pagination.limit, localSearch, filterDepartment, filterStatus);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, pagination.limit, filterDepartment, filterStatus]);

  const handlePageChange = (newPage) => {
    fetchInstructors(newPage, pagination.limit, searchTerm, filterDepartment, filterStatus);
  };

  const handleViewInstructor = (instructor) => {
    navigate(`/instructors/${instructor._id}`);
  };

  const handleEditInstructor = (instructor) => {
    navigate(`/instructors/edit/${instructor._id}`);
  };

  const handleViewSalary = (instructor) => {
    setSelectedInstructor(instructor);
    setShowSalaryModal(true);
  };

  const handleDeleteInstructor = (instructor) => {
    setDeleteConfirm(instructor);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      const result = await deleteInstructor(deleteConfirm._id);
      if (result.success) {
        setDeleteConfirm(null);
        fetchInstructorStats();
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSalaryPaid = () => {
    // Refresh instructor list and stats
    fetchInstructors(pagination.current, pagination.limit, searchTerm, filterDepartment, filterStatus);
    fetchInstructorStats();
  };

  const clearFilters = () => {
    setFilterDepartment("");
    setFilterStatus("");
    setLocalSearch("");
    fetchInstructors(1, pagination.limit, "", "", "");
  };

  return (
    <Layout>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Instructor Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage all instructors at Serian Institute
            </p>
          </div>

          {user?.role === "admin" && (
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <Link
                to="/instructors/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Instructor
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Instructors</p>
              <p className="text-2xl font-bold text-gray-900">
                {instructorStats?.total || 0}
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
                {instructorStats?.active || 0}
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
              <p className="text-sm font-medium text-gray-600">On Leave</p>
              <p className="text-2xl font-bold text-gray-900">
                {instructorStats?.onLeave || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {instructorStats?.byDepartment?.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {instructorStats?.newThisMonth || 0}
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
              placeholder="Search instructors by name, ID, department, or specialization..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex space-x-3">
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Driving School">Driving School</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="CNA">CNA</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>

            {(filterDepartment || filterStatus || localSearch) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Instructors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <InstructorTable
          instructors={instructors}
          loading={loading}
          onView={handleViewInstructor}
          onEdit={handleEditInstructor}
          onDelete={handleDeleteInstructor}
          onViewSalary={handleViewSalary}
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
                  Delete Instructor
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete {deleteConfirm.user?.name}?
                    This action cannot be undone.
                  </p>
                  {deleteConfirm.assignedCourses?.length > 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      Warning: This instructor is assigned to {deleteConfirm.assignedCourses.length} course(s).
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

      {/* Salary Payment Modal */}
      {showSalaryModal && selectedInstructor && (
        <SalaryPaymentModal
          instructor={selectedInstructor}
          onClose={() => {
            setShowSalaryModal(false);
            setSelectedInstructor(null);
          }}
          onSuccess={handleSalaryPaid}
        />
      )}
    </Layout>
  );
};

export default Instructors;