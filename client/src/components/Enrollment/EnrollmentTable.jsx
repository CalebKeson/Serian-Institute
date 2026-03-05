import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Hash,
  Calendar,
  Award,
  MoreVertical,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  UserMinus,
  RefreshCw,
  Minus
} from 'lucide-react';

const EnrollmentTable = ({ 
  enrollments, 
  loading, 
  onRemoveStudent,
  onUpdateEnrollment,
  currentUser,
  courseId,
  view = 'course'
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowActionsMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      enrolled: { 
        color: 'bg-green-100 text-green-800', 
        icon: CheckCircle, 
        label: 'Enrolled' 
      },
      dropped: { 
        color: 'bg-red-100 text-red-800', 
        icon: XCircle, 
        label: 'Dropped' 
      },
      completed: { 
        color: 'bg-blue-100 text-blue-800', 
        icon: Award, 
        label: 'Completed' 
      },
      waitlisted: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: Clock, 
        label: 'Waitlisted' 
      }
    };
    
    const config = statusConfig[status] || statusConfig.enrolled;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // CHANGED: Default grade display when no grade is assigned
  const getGradeBadge = (grade) => {
    if (!grade) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
          <Minus className="w-3 h-3 mr-1" />
          Not Graded
        </span>
      );
    }
    
    const gradeColors = {
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeColors[grade] || 'bg-gray-100 text-gray-800'}`}>
        {grade}
      </span>
    );
  };

  const handleRemoveClick = async (enrollment) => {
    const studentName = enrollment.student?.user?.name || 'this student';
    if (window.confirm(`Are you sure you want to remove ${studentName} from this course?`)) {
      setActionLoading(true);
      try {
        await onRemoveStudent(enrollment.student._id);
        setShowActionsMenu(null);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleStatusChange = async (enrollment, newStatus) => {
    setActionLoading(true);
    try {
      await onUpdateEnrollment(enrollment._id, { status: newStatus });
      setShowActionsMenu(null);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleActionsMenu = (enrollmentId, e) => {
    e.stopPropagation();
    setShowActionsMenu(showActionsMenu === enrollmentId ? null : enrollmentId);
  };

  // Check if user can manage enrollments
  const canManage = ['admin', 'instructor', 'receptionist'].includes(currentUser?.role);

  if (loading || actionLoading) {
    return (
      <div className="animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No enrollments found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {view === 'course' 
            ? 'No students match the selected filter.'
            : 'This student has no enrollments matching the selected filter.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {view === 'course' ? (
              <>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                {canManage && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </>
            ) : (
              <>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                {canManage && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {enrollments.map((enrollment) => (
            <tr key={enrollment._id} className="hover:bg-gray-50 transition-colors">
              {view === 'course' ? (
                <>
                  {/* Student Info Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {enrollment.student?.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.student?.user?.name || 'Unknown Student'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {enrollment.student?.user?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Student ID Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Hash className="w-4 h-4 mr-2 text-blue-500" />
                      {enrollment.student?.studentId || 'N/A'}
                    </div>
                  </td>

                  {/* Enrollment Date Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(enrollment.enrollmentDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      By: {enrollment.enrolledBy?.name || 'System'}
                    </div>
                  </td>
                </>
              ) : (
                <>
                  {/* Course Info Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {enrollment.course?.courseCode?.charAt(0) || 'C'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {enrollment.course?.courseCode} - {enrollment.course?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Instructor: {enrollment.course?.instructor?.name || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Enrollment Date Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                      {formatDate(enrollment.enrollmentDate)}
                    </div>
                  </td>
                </>
              )}

              {/* Status Column */}
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(enrollment.status)}
              </td>

              {/* Grade Column - CHANGED: Now shows default "Not Graded" */}
              <td className="px-6 py-4 whitespace-nowrap">
                {getGradeBadge(enrollment.grade)}
              </td>

              {/* Actions Column */}
              {canManage && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                  <button
                    onClick={(e) => toggleActionsMenu(enrollment._id, e)}
                    disabled={actionLoading}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                    title="Actions"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showActionsMenu === enrollment._id && (
                    <div 
                      ref={menuRef}
                      className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-200"
                    >
                      <div className="py-1" role="menu">
                        {enrollment.status === 'enrolled' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(enrollment, 'completed')}
                              disabled={actionLoading}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              role="menuitem"
                            >
                              <CheckCircle className="w-4 h-4 mr-3 text-green-500" />
                              Mark as Completed
                            </button>
                            <button
                              onClick={() => handleStatusChange(enrollment, 'dropped')}
                              disabled={actionLoading}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              role="menuitem"
                            >
                              <UserMinus className="w-4 h-4 mr-3 text-red-500" />
                              Mark as Dropped
                            </button>
                          </>
                        )}
                        
                        {(enrollment.status === 'completed' || enrollment.status === 'dropped') && (
                          <button
                            onClick={() => handleStatusChange(enrollment, 'enrolled')}
                            disabled={actionLoading}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                            role="menuitem"
                          >
                            <RefreshCw className="w-4 h-4 mr-3 text-blue-500" />
                            Re-enroll Student
                          </button>
                        )}
                        
                        <div className="border-t border-gray-100 my-1"></div>
                        
                        <button
                          onClick={() => handleRemoveClick(enrollment)}
                          disabled={actionLoading}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          role="menuitem"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Remove from Course
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EnrollmentTable;