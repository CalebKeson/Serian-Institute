// src/components/Enrollment/AddStudentModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Search, 
  UserPlus, 
  User, 
  Mail, 
  Phone,
  Check,
  AlertCircle
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

  const handleEnroll = () => {
    if (selectedStudent) {
      onEnrollStudent(selectedStudent._id, notes);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
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

        {/* Notes Section */}
        {selectedStudent && (
          <div className="mb-6">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Enrollment Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Add any notes about this enrollment..."
            />
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
            className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Enrolling...' : 'Enroll Student'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;