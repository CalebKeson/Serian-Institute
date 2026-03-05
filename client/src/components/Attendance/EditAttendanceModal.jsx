// src/components/Attendance/EditAttendanceModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserCheck,
  Clock as TimeIcon,
  ChevronDown
} from 'lucide-react';
import { useAttendanceStore } from '../../stores/attendanceStore'; // Make sure this import is present

const EditAttendanceModal = ({
  isOpen,
  onClose,
  attendanceRecord,
  onSave,
  loading
}) => {
  const [formData, setFormData] = useState({
    status: 'present',
    checkInTime: '',
    excusedReason: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showExcusedReason, setShowExcusedReason] = useState(false);
  const [showCheckInTime, setShowCheckInTime] = useState(false);
  const [timeValidation, setTimeValidation] = useState({ valid: true, message: '' });
  
  // Get store methods
  const { 
    validateCheckInTime, 
    getLateDuration, 
    getLateColorClass,
    getLateBgColorClass,
    getQuickTimeOptions,
    currentClassSchedule,
    openExcusedModal // Add this
  } = useAttendanceStore();

  // Predefined options for excused reasons
  const excusedReasonOptions = [
    'Medical Appointment',
    'Family Emergency',
    'Transport Issues',
    'Personal Reasons',
    'Religious Observance',
    'Other'
  ];

  // Parse class start time from schedule
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
  const quickTimeOptions = getQuickTimeOptions(classStartTime);

  // Initialize form when attendance record changes
  useEffect(() => {
    if (attendanceRecord) {
      setFormData({
        status: attendanceRecord.status || 'present',
        checkInTime: attendanceRecord.checkInTime || '',
        excusedReason: attendanceRecord.excusedReason || '',
        notes: attendanceRecord.notes || ''
      });
      
      setShowExcusedReason(attendanceRecord.status === 'excused');
      setShowCheckInTime(attendanceRecord.status === 'late');
      
      // Validate time if it's a late record
      if (attendanceRecord.status === 'late' && attendanceRecord.checkInTime && classStartTime) {
        const validation = validateCheckInTime(attendanceRecord.checkInTime, classStartTime);
        setTimeValidation(validation);
      }
    }
  }, [attendanceRecord, classStartTime]);

  // Handle status change
  const handleStatusChange = (status) => {
    setFormData(prev => ({
      ...prev,
      status,
      // Clear conditional fields when switching away
      checkInTime: status === 'late' ? prev.checkInTime : '',
      excusedReason: status === 'excused' ? prev.excusedReason : ''
    }));
    
    setShowExcusedReason(status === 'excused');
    setShowCheckInTime(status === 'late');
    
    // Clear errors for the new status
    if (errors.checkInTime || errors.excusedReason) {
      setErrors({});
    }
    
    // Reset time validation
    setTimeValidation({ valid: true, message: '' });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Validate time if it's the checkInTime field
    if (name === 'checkInTime' && classStartTime) {
      const validation = validateCheckInTime(value, classStartTime);
      setTimeValidation(validation);
    }
  };

  // Handle quick time selection
  const handleQuickTimeSelect = (timeString) => {
    setFormData(prev => ({
      ...prev,
      checkInTime: timeString
    }));
    
    if (classStartTime) {
      const validation = validateCheckInTime(timeString, classStartTime);
      setTimeValidation(validation);
    }
    
    if (errors.checkInTime) {
      setErrors(prev => ({
        ...prev,
        checkInTime: ''
      }));
    }
  };

  // Handle predefined excused reason selection
  const handleExcusedReasonSelect = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      excusedReason: value === 'Other' ? '' : value
    }));
    
    if (errors.excusedReason) {
      setErrors(prev => ({
        ...prev,
        excusedReason: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Status is always required and should be valid
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    // Validate check-in time for late status
    if (formData.status === 'late') {
      if (!formData.checkInTime) {
        newErrors.checkInTime = 'Check-in time is required for late arrivals';
      } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.checkInTime)) {
        newErrors.checkInTime = 'Please enter a valid time in HH:MM format';
      } else if (classStartTime && !timeValidation.valid) {
        newErrors.checkInTime = timeValidation.message;
      }
    }

    // Validate excused reason for excused status
    if (formData.status === 'excused') {
      if (!formData.excusedReason) {
        newErrors.excusedReason = 'Reason is required for excused absences';
      } else if (formData.excusedReason.length > 200) {
        newErrors.excusedReason = 'Reason cannot exceed 200 characters';
      }
    }

    // Notes validation (optional, but max length)
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Set check-in time to current time
  const setCurrentTime = () => {
    const currentTime = getCurrentTime();
    setFormData(prev => ({
      ...prev,
      checkInTime: currentTime
    }));
    
    if (classStartTime) {
      const validation = validateCheckInTime(currentTime, classStartTime);
      setTimeValidation(validation);
    }
    
    if (errors.checkInTime) {
      setErrors(prev => ({
        ...prev,
        checkInTime: ''
      }));
    }
  };

  // Get late duration display
  const getLateDurationDisplay = () => {
    if (!formData.checkInTime || !classStartTime) return null;
    return getLateDuration(formData.checkInTime, classStartTime);
  };

  // Get color class for time display
  const getTimeDisplayColor = () => {
    if (!formData.checkInTime || !classStartTime) return 'text-gray-900';
    return getLateColorClass(formData.checkInTime, classStartTime);
  };

  // Get background color for time display
  const getTimeBgColor = () => {
    if (!formData.checkInTime || !classStartTime) return 'bg-gray-50';
    return getLateBgColorClass(formData.checkInTime, classStartTime);
  };

  // Handle edit reason button click - FIXED
  const handleEditReason = () => {
    // First close this modal
    onClose();
    
    // Small delay to ensure smooth transition
    setTimeout(() => {
      // Open the excused modal with the current attendance record
      openExcusedModal(attendanceRecord);
    }, 300);
  };

  if (!isOpen || !attendanceRecord) return null;

  const student = attendanceRecord.student;
  const isNewRecord = !attendanceRecord._id;
  const lateDuration = getLateDurationDisplay();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {isNewRecord ? 'Mark Attendance' : 'Edit Attendance'}
              </h2>
              <p className="text-sm text-gray-600">
                {isNewRecord ? 'Record attendance for student' : 'Update attendance record'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Info Card */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">
                {student?.user?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {student?.user?.name || 'Unknown Student'}
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  {student?.user?.email || 'No email'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2 text-blue-500" />
                  {student?.phone || 'No phone'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  ID: {student?.studentId || 'N/A'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  {new Date(attendanceRecord.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Class Schedule Info (if available) */}
        {currentClassSchedule && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Class Schedule:</span>
              </div>
              <span className="text-sm text-blue-700">
                {currentClassSchedule.time} • {currentClassSchedule.days?.join(', ')}
              </span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attendance Status *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Present */}
              <button
                type="button"
                onClick={() => handleStatusChange('present')}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  formData.status === 'present'
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <CheckCircle className={`w-6 h-6 ${
                  formData.status === 'present' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  formData.status === 'present' ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Present
                </span>
              </button>

              {/* Absent */}
              <button
                type="button"
                onClick={() => handleStatusChange('absent')}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  formData.status === 'absent'
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                <XCircle className={`w-6 h-6 ${
                  formData.status === 'absent' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  formData.status === 'absent' ? 'text-red-700' : 'text-gray-600'
                }`}>
                  Absent
                </span>
              </button>

              {/* Late */}
              <button
                type="button"
                onClick={() => handleStatusChange('late')}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  formData.status === 'late'
                    ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-200'
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50'
                }`}
              >
                <TimeIcon className={`w-6 h-6 ${
                  formData.status === 'late' ? 'text-yellow-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  formData.status === 'late' ? 'text-yellow-700' : 'text-gray-600'
                }`}>
                  Late
                </span>
              </button>

              {/* Excused */}
              <button
                type="button"
                onClick={() => handleStatusChange('excused')}
                className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                  formData.status === 'excused'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <FileText className={`w-6 h-6 ${
                  formData.status === 'excused' ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <span className={`text-sm font-medium ${
                  formData.status === 'excused' ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  Excused
                </span>
              </button>
            </div>
            {errors.status && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.status}
              </p>
            )}
          </div>

          {/* Check-in Time for Late - ENHANCED */}
          {showCheckInTime && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <label htmlFor="checkInTime" className="block text-sm font-medium text-yellow-800 mb-2">
                Check-in Time *
              </label>
              
              {/* Quick Time Options */}
              {classStartTime && quickTimeOptions.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-yellow-700 mb-2">Quick select:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickTimeOptions.map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleQuickTimeSelect(option.timeString)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          formData.checkInTime === option.timeString
                            ? 'bg-yellow-600 text-white'
                            : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Time Input with Current Time Button */}
              <div className="flex space-x-2 mb-2">
                <div className="relative flex-1">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    id="checkInTime"
                    name="checkInTime"
                    value={formData.checkInTime}
                    onChange={handleChange}
                    placeholder="HH:MM"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                      errors.checkInTime || !timeValidation.valid ? 'border-red-300' : 'border-yellow-300'
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={setCurrentTime}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Current Time
                </button>
              </div>

              {/* Late Duration Display */}
              {lateDuration && (
                <div className={`mt-2 p-2 rounded-lg ${getTimeBgColor()} flex items-center justify-between`}>
                  <span className="text-sm font-medium">Late duration:</span>
                  <span className={`text-sm font-bold ${getTimeDisplayColor()}`}>
                    {lateDuration}
                  </span>
                </div>
              )}

              {/* Error Messages */}
              {errors.checkInTime && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.checkInTime}
                </p>
              )}
              {!timeValidation.valid && !errors.checkInTime && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {timeValidation.message}
                </p>
              )}
              
              {/* Help Text */}
              <p className="mt-2 text-xs text-yellow-700">
                {classStartTime 
                  ? `Class starts at ${classStartTime}. Enter time in 24-hour format (e.g., 09:30, 14:45)`
                  : 'Enter time in 24-hour format (e.g., 09:30, 14:45)'}
              </p>
            </div>
          )}

          {/* Excused Reason - FIXED */}
          {showExcusedReason && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-blue-800">
                  Excused Reason
                </label>
                <button
                  type="button"
                  onClick={handleEditReason}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Edit Reason
                </button>
              </div>
              
              {/* Display current reason */}
              {formData.excusedReason ? (
                <div className="p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">{formData.excusedReason}</p>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {formData.excusedReason.length}/200 characters
                  </p>
                </div>
              ) : (
                <p className="text-sm text-blue-600 italic">
                  No reason provided. Click "Edit Reason" to add one.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.notes ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Any additional notes about this attendance..."
              maxLength="500"
            />
            {errors.notes && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.notes}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 text-right">
              {formData.notes.length}/500 characters
            </p>
          </div>

          {/* Metadata (for existing records) */}
          {!isNewRecord && attendanceRecord.markedBy && (
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>
                  <span className="font-medium">Marked by:</span> {attendanceRecord.markedBy?.name || 'Unknown'}
                </span>
                <span>
                  <span className="font-medium">Last updated:</span>{' '}
                  {new Date(attendanceRecord.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isNewRecord ? 'Mark Attendance' : 'Update Attendance'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAttendanceModal;