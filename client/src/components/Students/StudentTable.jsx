// src/components/Students/StudentTable.jsx - COMPLETE RESPONSIVE REDESIGN

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Edit, 
  Eye, 
  Trash2, 
  Phone, 
  Mail,
  Calendar,
  BadgeCheck,
  XCircle,
  GraduationCap,
  AlertCircle,
  Hash,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from 'lucide-react';
import { useEnrollmentStore } from '../../stores/enrollmentStore';

const StudentTable = ({ 
  students, 
  loading, 
  onView, 
  onEdit, 
  onDelete,
  currentUser 
}) => {
  const { fetchStudentEnrollments } = useEnrollmentStore();
  const [studentAdmissionData, setStudentAdmissionData] = useState({});
  const [expandedRows, setExpandedRows] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch admission numbers for each student
  useEffect(() => {
    const fetchAdmissionNumbers = async () => {
      const admissionMap = {};
      for (const student of students) {
        try {
          const result = await fetchStudentEnrollments(student._id, 'enrolled');
          
          if (result && result.length > 0) {
            const admissionNumbers = result
              .filter(e => e.admissionNumber)
              .map(e => e.admissionNumber);
            
            admissionMap[student._id] = {
              hasEnrollments: admissionNumbers.length > 0,
              admissionNumbers: admissionNumbers,
              displayText: admissionNumbers.length > 0 ? 'Enrolled' : 'Not Enrolled',
              displayNumbers: admissionNumbers.join(', ')
            };
          } else {
            admissionMap[student._id] = {
              hasEnrollments: false,
              admissionNumbers: [],
              displayText: 'Not Enrolled',
              displayNumbers: 'None'
            };
          }
        } catch (error) {
          console.error('Error fetching student enrollments:', error);
          admissionMap[student._id] = {
            hasEnrollments: false,
            admissionNumbers: [],
            displayText: 'Not Enrolled',
            displayNumbers: 'None'
          };
        }
      }
      setStudentAdmissionData(admissionMap);
    };

    if (students.length > 0) {
      fetchAdmissionNumbers();
    }
  }, [students, fetchStudentEnrollments]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: BadgeCheck, label: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Inactive' },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Suspended' },
      graduated: { color: 'bg-purple-100 text-purple-800', icon: GraduationCap, label: 'Graduated' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getEnrollmentStatusBadge = (admissionData) => {
    if (!admissionData || !admissionData.hasEnrollments) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Not Enrolled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <GraduationCap className="w-3 h-3 mr-1" />
        Enrolled
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleRowExpand = (studentId) => {
    setExpandedRows(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
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

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new student.</p>
      </div>
    );
  }

  // Desktop View - Full Table with horizontal scroll
  return (
    <div className="w-full overflow-x-auto">
      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Student ID
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Enrollment Date
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Admission Number(s)
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Enrollment Status
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-blue-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => {
              const admissionData = studentAdmissionData[student._id] || {
                hasEnrollments: false,
                admissionNumbers: [],
                displayText: 'Not Enrolled',
                displayNumbers: 'None'
              };

              return (
                <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                  {/* Student Name & Avatar */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-9 w-9 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-white font-medium text-sm">
                          {student.user?.name?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-gray-900">
                          {student.user?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]">
                          {student.user?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Student ID */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <code className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                      {student.studentId || 'Not assigned'}
                    </code>
                  </td>

                  {/* Contact Info */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-600 flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {student.phone || 'No phone'}
                    </div>
                  </td>

                  {/* Enrollment Date */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                      {formatDate(student.enrollmentDate)}
                    </div>
                  </td>

                  {/* Admission Numbers */}
                  <td className="px-4 py-3">
                    {admissionData.hasEnrollments && admissionData.admissionNumbers.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {admissionData.admissionNumbers.slice(0, 2).map((admissionNumber, idx) => (
                          <code key={idx} className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {admissionNumber}
                          </code>
                        ))}
                        {admissionData.admissionNumbers.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{admissionData.admissionNumbers.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">None</span>
                    )}
                  </td>

                  {/* Enrollment Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getEnrollmentStatusBadge(admissionData)}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(student.status)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onView(student)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Student"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {currentUser?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => onEdit(student)}
                            className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {!admissionData.hasEnrollments ? (
                            <button
                              onClick={() => onDelete(student)}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                              title="Cannot delete student with enrollments"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card Layout */}
      <div className="md:hidden space-y-3">
        {students.map((student) => {
          const admissionData = studentAdmissionData[student._id] || {
            hasEnrollments: false,
            admissionNumbers: [],
            displayText: 'Not Enrolled',
            displayNumbers: 'None'
          };
          const isExpanded = expandedRows[student._id];

          return (
            <div key={student._id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRowExpand(student._id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-medium text-sm">
                      {student.user?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {student.user?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {student.studentId || 'No ID'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getEnrollmentStatusBadge(admissionData)}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Card Body - Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                  {/* Contact */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Phone:</span>
                    <span className="text-sm text-gray-700">{student.phone || 'N/A'}</span>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Email:</span>
                    <span className="text-sm text-gray-700 truncate max-w-[180px]">
                      {student.user?.email || 'N/A'}
                    </span>
                  </div>
                  
                  {/* Enrollment Date */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Enrolled:</span>
                    <span className="text-sm text-gray-700">{formatDate(student.enrollmentDate)}</span>
                  </div>
                  
                  {/* Admission Numbers */}
                  {admissionData.hasEnrollments && admissionData.admissionNumbers.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-gray-500 pt-1">Admission #:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                        {admissionData.admissionNumbers.map((num, idx) => (
                          <code key={idx} className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {num}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Student Status:</span>
                    {getStatusBadge(student.status)}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      onClick={() => onView(student)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    
                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => onEdit(student)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        
                        {!admissionData.hasEnrollments ? (
                          <button
                            onClick={() => onDelete(student)}
                            className="flex-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-1 px-3 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed flex items-center justify-center"
                            title="Cannot delete student with enrollments"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentTable;