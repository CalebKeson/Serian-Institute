// src/components/Enrollment/AddStudentModal.jsx - COMPLETE WITH HISTORICAL DATE PICKER

import React, { useState } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  User, 
  Mail, 
  Phone,
  Check,
  AlertCircle,
  Calendar,
  Clock
} from 'lucide-react';

const AddStudentModal = ({
  course,
  availableStudents,
  searchTerm,
  onSearchChange,
  onEnrollStudent,
  onClose,
  loading
}) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [notes, setNotes] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isHistoricalEnrollment, setIsHistoricalEnrollment] = useState(false);

  const handleEnroll = () => {
    if (selectedStudent) {
      // Pass enrollment date if it's a historical enrollment
      const enrollmentData = {
        studentId: selectedStudent._id,
        notes: notes,
        ...(isHistoricalEnrollment && enrollmentDate && { enrollmentDate })
      };
      onEnrollStudent(selectedStudent._id, notes, enrollmentData);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <UserPlus className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Student to Course</h2>
              <p className="text-sm text-gray-600">
                {course.courseCode} - {course.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Capacity Alert */}
        {course.availableSpots === 0 ? (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Course Full</h4>
                <p className="text-sm text-red-700 mt-1">
                  This course has reached its maximum capacity. You cannot enroll additional students.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                Available Spots: {course.availableSpots}
              </span>
              <span className="text-sm text-blue-600">
                {course.enrolledCount} / {course.maxStudents} enrolled
              </span>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Students
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, student ID, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>

        {/* Student Selection */}
        <div className="mb-6 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          {availableStudents.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {searchTerm ? 'No students found matching your search.' : 'Start typing to search for students.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {availableStudents.map((student) => (
                <div
                  key={student._id}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedStudent?._id === student._id
                      ? 'bg-purple-50 border-l-4 border-l-purple-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {student.user?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {student.user?.name}
                        </h4>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {student.user?.email}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {student.phone} • {student.studentId}
                        </p>
                      </div>
                    </div>
                    {selectedStudent?._id === student._id && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Historical Enrollment Section */}
        {selectedStudent && course.availableSpots > 0 && (
          <div className="mb-6 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                Enrollment Details
              </h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isHistoricalEnrollment}
                  onChange={(e) => setIsHistoricalEnrollment(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Historical enrollment (past date)</span>
              </label>
            </div>

            {/* Date Picker for Historical Enrollment */}
            {isHistoricalEnrollment && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <label htmlFor="enrollmentDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Enrollment Date *
                    </label>
                    <input
                      type="date"
                      id="enrollmentDate"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <p className="mt-2 text-xs text-yellow-700">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Setting a past date will record this enrollment as a historical enrollment.
                      The admission number will be generated sequentially based on current enrollments.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Current Date Display (when not historical) */}
            {!isHistoricalEnrollment && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Enrollment will be recorded with today's date: <strong>{new Date().toLocaleDateString()}</strong>
                </span>
              </div>
            )}

            {/* Notes Section */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Enrollment Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Add any notes about this enrollment (e.g., transfer student, special circumstances, etc.)"
              />
            </div>
          </div>
        )}

        {/* Info Box about Admission Numbers */}
        {selectedStudent && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-purple-600 mt-0.5 mr-2" />
              <div className="text-xs text-purple-700">
                <p className="font-medium mb-1">About Admission Numbers:</p>
                <p>
                  Admission numbers are automatically generated in format: <strong>{course.courseCode}/XXX/YY</strong>
                  (e.g., {course.courseCode}/001/{new Date().getFullYear().toString().slice(-2)})
                </p>
                <p className="mt-1">
                  The sequence number is based on total enrollments in this course, not the enrollment date.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEnroll}
            disabled={!selectedStudent || loading || course.availableSpots === 0}
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enrolling...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                {isHistoricalEnrollment ? 'Enroll with Historical Date' : 'Enroll Student'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;