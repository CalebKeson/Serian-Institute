import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import { formatDateForInput, formatTime } from '../../utils/calendarUtils';

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { currentEvent, fetchEvent, updateEvent, loading, clearCurrentEvent } = useEventStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isAllDay: true,
    startTime: '09:00',
    endTime: '17:00',
    location: '',
    eventType: 'academic',
    noClasses: false,
    officesClosed: false,
    isPublicHoliday: false,
    forRoles: ['all']
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (id) {
      fetchEvent(id);
    }
    
    return () => {
      clearCurrentEvent();
    };
  }, [id]);
  
  useEffect(() => {
    if (currentEvent) {
      setFormData({
        title: currentEvent.title || '',
        description: currentEvent.description || '',
        startDate: formatDateForInput(currentEvent.startDate),
        endDate: formatDateForInput(currentEvent.endDate),
        isAllDay: currentEvent.isAllDay ?? true,
        startTime: currentEvent.startTime ? formatTime(currentEvent.startTime).replace(/\s?(AM|PM)/, '') : '09:00',
        endTime: currentEvent.endTime ? formatTime(currentEvent.endTime).replace(/\s?(AM|PM)/, '') : '17:00',
        location: currentEvent.location || '',
        eventType: currentEvent.eventType || 'academic',
        noClasses: currentEvent.noClasses || false,
        officesClosed: currentEvent.officesClosed || false,
        isPublicHoliday: currentEvent.isPublicHoliday || false,
        forRoles: currentEvent.forRoles || ['all']
      });
    }
  }, [currentEvent]);
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    navigate('/events');
    return null;
  }
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleRoleChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      let roles = [...prev.forRoles];
      if (checked) {
        roles.push(value);
      } else {
        roles = roles.filter(r => r !== value);
      }
      return { ...prev, forRoles: roles };
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await updateEvent(id, formData);
      
      if (result.success) {
        navigate(`/events/${id}`);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate(`/events/${id}`);
  };
  
  if (loading && !currentEvent) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancel}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
                Edit Event
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Update event details
              </p>
            </div>
          </div>
        </div>
        
        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>
            
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="academic">Academic (Exams, Registration, etc.)</option>
                <option value="holiday">Holiday (School break)</option>
                <option value="social">Social (Sports, Cultural events)</option>
                <option value="administrative">Administrative (Meetings, Training)</option>
                <option value="closure">Closure (Emergency, Weather)</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>
            
            {/* All Day Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAllDay"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isAllDay" className="ml-2 text-sm text-gray-700">
                All day event
              </label>
            </div>
            
            {/* Time (if not all day) */}
            {!formData.isAllDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
            
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Impact Flags - Same as AddEvent */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Impact
              </label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="noClasses"
                    checked={formData.noClasses}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">No classes scheduled</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="officesClosed"
                    checked={formData.officesClosed}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Administrative offices closed</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isPublicHoliday"
                    checked={formData.isPublicHoliday}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Public holiday</span>
                </label>
              </div>
            </div>
            
            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="all"
                    checked={formData.forRoles.includes('all')}
                    onChange={handleRoleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Everyone</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="students"
                    checked={formData.forRoles.includes('students')}
                    onChange={handleRoleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Students</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="instructors"
                    checked={formData.forRoles.includes('instructors')}
                    onChange={handleRoleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Instructors</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    value="staff"
                    checked={formData.forRoles.includes('staff')}
                    onChange={handleRoleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Staff</span>
                </label>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 inline mr-1" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-1" />
                {isSubmitting || loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditEvent;