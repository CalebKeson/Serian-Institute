// src/components/Attendance/AttendanceTable.jsx
import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  Edit,
  Eye,
  Calendar,
  AlertCircle,
  UserX
} from 'lucide-react';
import { useAttendanceStore } from '../../stores/attendanceStore';

const AttendanceTable = ({ 
  attendance, 
  loading, 
  onStatusUpdate,
  onViewStudent,
  onEditAttendance,
  currentUser,
  courseId,
  view = 'course' 
}) => {
  const { getLateDuration, getLateColorClass, currentClassSchedule } = useAttendanceStore();

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Present' },
      absent: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Absent' },
      late: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Late' },
      excused: { color: 'bg-blue-100 text-blue-800', icon: FileText, label: 'Excused' }
    };
    
    const config = statusConfig[status] || statusConfig.absent;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'text-green-600 hover:text-green-800',
      absent: 'text-red-600 hover:text-red-800', 
      late: 'text-yellow-600 hover:text-yellow-800',
      excused: 'text-blue-600 hover:text-blue-800'
    };
    return colors[status] || 'text-gray-600 hover:text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get class start time from schedule
  const getClassStartTime = () => {
    if (!currentClassSchedule?.time) return null;
    
    const timeStr = currentClassSchedule.time;
    const match = timeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    
    if (match) {
      const time = match[1];
      const [hourMin, period] = time.split(/\s+/);
      let [hours, minutes] = hourMin.split(':').map(Number);
      
      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    return null;
  };

  const classStartTime = getClassStartTime();

  const handleQuickStatusUpdate = (studentId, newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(studentId, newStatus);
    }
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

  if (attendance.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
        <p className="mt-1 text-sm text-gray-500">
          {view === 'course' 
            ? 'No attendance has been marked for this date.' 
            : 'No attendance records found for this period.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-blue-50">
          <tr>
            {view === 'course' ? (
              <>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Current Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Details
                </th>
                {currentUser?.role === 'admin' && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Quick Actions
                  </th>
                )}
              </>
            ) : (
              <>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Course
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Date & Session
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
                  Marked By
                </th>
                {currentUser?.role === 'admin' && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {attendance.map((record) => {
            const isNotMarked = record._id === null;
            const lateDuration = record.status === 'late' && record.checkInTime && classStartTime
              ? getLateDuration(record.checkInTime, classStartTime)
              : null;
            const lateColorClass = record.status === 'late' && record.checkInTime && classStartTime
              ? getLateColorClass(record.checkInTime, classStartTime)
              : '';
            
            return (
              <tr 
                key={record._id || `student-${record.student?._id}`} 
                className={`hover:bg-gray-50 transition-colors ${
                  isNotMarked ? 'bg-gray-50/50' : ''
                }`}
              >
                {view === 'course' ? (
                  <>
                    {/* Student Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                          isNotMarked 
                            ? 'bg-gray-300' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700'
                        }`}>
                          {isNotMarked ? (
                            <UserX className="w-5 h-5 text-gray-500" />
                          ) : (
                            <span className="text-white font-medium text-sm">
                              {record.student?.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.student?.user?.name || 'Unknown Student'}
                            {isNotMarked && (
                              <span className="ml-2 text-xs text-gray-500">(Not marked)</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1 text-blue-500" />
                            {record.student?.studentId || 'No ID'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-500" />
                        {record.student?.user?.email || 'No email'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Phone className="w-4 h-4 mr-2 text-blue-500" />
                        {record.student?.phone || 'No phone'}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                      {isNotMarked && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Awaiting attendance
                        </div>
                      )}
                    </td>

                    {/* Details Column - ENHANCED with late duration */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isNotMarked ? (
                        <div className="text-sm text-gray-500 italic">
                          Not marked yet
                        </div>
                      ) : (
                        <>
                          {record.status === 'late' && record.checkInTime && (
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                                Checked in: {formatTime(record.checkInTime)}
                              </div>
                              {lateDuration && (
                                <div className={`text-xs font-medium mt-1 ${lateColorClass}`}>
                                  {lateDuration}
                                </div>
                              )}
                            </div>
                          )}
                          {record.status === 'excused' && record.excusedReason && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Reason:</span> {record.excusedReason}
                            </div>
                          )}
                          {record.notes && (
                            <div className="text-xs text-gray-500 mt-1">
                              Note: {record.notes}
                            </div>
                          )}
                          {record.markedBy && (
                            <div className="text-xs text-gray-400 mt-1">
                              By {record.markedBy?.name} at {new Date(record.markedAt).toLocaleTimeString()}
                            </div>
                          )}
                          {!record.status && !record.notes && !record.markedBy && (
                            <div className="text-sm text-gray-500 italic">
                              No additional details
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    {/* Quick Actions Column */}
                    {currentUser?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {/* Quick Status Buttons */}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleQuickStatusUpdate(record.student._id, 'present')}
                              className={`p-1 rounded transition-colors ${
                                record.status === 'present' && !isNotMarked
                                  ? 'bg-green-100 text-green-700' 
                                  : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title="Mark Present"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleQuickStatusUpdate(record.student._id, 'absent')}
                              className={`p-1 rounded transition-colors ${
                                record.status === 'absent' && !isNotMarked
                                  ? 'bg-red-100 text-red-700' 
                                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title="Mark Absent"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleQuickStatusUpdate(record.student._id, 'late')}
                              className={`p-1 rounded transition-colors ${
                                record.status === 'late' && !isNotMarked
                                  ? 'bg-yellow-100 text-yellow-700' 
                                  : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                              }`}
                              title="Mark Late"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleQuickStatusUpdate(record.student._id, 'excused')}
                              className={`p-1 rounded transition-colors ${
                                record.status === 'excused' && !isNotMarked
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                              }`}
                              title="Mark Excused"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>

                          {/* View Student Profile */}
                          <button
                            onClick={() => onViewStudent && onViewStudent(record.student._id)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                            title="View Student"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Attendance (for existing records) */}
                          {!isNotMarked && (
                            <button
                              onClick={() => onEditAttendance && onEditAttendance(record)}
                              className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded"
                              title="Edit Attendance"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </>
                ) : (
                  // Student View - unchanged
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg flex items-center justify-center">
                          <span className="text-white font-medium text-xs">C</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {record.course?.courseCode}
                          </div>
                          <div className="text-sm text-gray-500">
                            {record.course?.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(record.date)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {record.session.replace('-', ' ')} session
                      </div>
                      {record.status === 'late' && record.checkInTime && (
                        <div className="text-xs text-yellow-600 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(record.checkInTime)}
                          {lateDuration && (
                            <span className="ml-1">({lateDuration})</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                      {record.notes && (
                        <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                          {record.notes}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.markedBy?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(record.markedAt).toLocaleDateString()}
                      </div>
                    </td>

                    {currentUser?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => onEditAttendance && onEditAttendance(record)}
                            className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded"
                            title="Edit Attendance"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => onViewStudent && onViewStudent(record.course._id)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                            title="View Course"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;