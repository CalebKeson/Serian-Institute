// src/pages/Courses/EditCourse.jsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  BookOpen, 
  ArrowLeft,
  Save,
  X,
  User,
  Calendar,
  Clock,
  MapPin,
  Users,
  Building,
  GraduationCap,
  AlertCircle,
  Loader,
  Award,
  Wrench,
  CheckCircle,
  Hash,
  Tag,
  Car,
  Droplets,
  Zap,
  Cpu,
  FileText
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useCourseStore } from '../../stores/courseStore';
import { useInstructorStore } from '../../stores/instructorStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const EditCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuthStore();
  const { 
    currentCourse, 
    fetchCourse, 
    updateCourse, 
    loading,
    clearCurrentCourse 
  } = useCourseStore();

  const { instructors, fetchInstructors, loading: instructorsLoading } = useInstructorStore();

  const [formData, setFormData] = useState({
    // Basic course information (from your Course model)
    courseCode: '',
    name: '',
    description: '',
    courseType: '',
    duration: '',
    intakeMonth: '',
    intakeYear: '',
    batchNumber: '',
    
    // Instructor
    instructor: '',
    
    // Schedule information
    schedule: {
      days: [],
      time: '',
      room: ''
    },
    
    // Course capacity and requirements
    maxStudents: 20,
    practicalHours: 0,
    workshopRequired: false,
    certification: '',
    requirements: '',
    
    // Status
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch course data and instructors when component mounts
  useEffect(() => {
    if (id) {
      fetchCourse(id);
    }
    
    if (['admin', 'instructor'].includes(user?.role)) {
      fetchInstructors();
    }

    return () => {
      clearCurrentCourse();
    };
  }, [id, user]);

  // Populate form when course data is loaded
  useEffect(() => {
    if (currentCourse) {
      setFormData({
        courseCode: currentCourse.courseCode || '',
        name: currentCourse.name || '',
        description: currentCourse.description || '',
        courseType: currentCourse.courseType || '',
        duration: currentCourse.duration || '',
        intakeMonth: currentCourse.intakeMonth || '',
        intakeYear: currentCourse.intakeYear || '',
        batchNumber: currentCourse.batchNumber || '',
        instructor: currentCourse.instructor?._id || '',
        schedule: {
          days: currentCourse.schedule?.days || [],
          time: currentCourse.schedule?.time || '',
          room: currentCourse.schedule?.room || ''
        },
        maxStudents: currentCourse.maxStudents || 20,
        practicalHours: currentCourse.practicalHours || 0,
        workshopRequired: currentCourse.workshopRequired || false,
        certification: currentCourse.certification || '',
        requirements: currentCourse.requirements || '',
        status: currentCourse.status || 'active'
      });
    }
  }, [currentCourse]);

  // Data options based on your Course model
  const courseTypes = [
    { value: 'driving', label: 'Driving Classes', icon: Car },
    { value: 'plumbing', label: 'Plumbing', icon: Droplets },
    { value: 'electrical', label: 'Electrical Installation', icon: Zap },
    { value: 'computer', label: 'Computer Packages', icon: Cpu }
  ];

  const durations = ['1 month', '3 months', '6 months'];
  
  const intakeMonths = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const certificationTypes = [
    'NTSA License',
    'Government Trade Test', 
    'Institutional Certificate',
    'Other'
  ];
  
  const statusOptions = ['active', 'inactive', 'completed', 'cancelled'];
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate year options (current year ± 2 years)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i.toString());
    }
    return years;
  };

  // Check if user is admin/instructor
  if (!['admin', 'instructor'].includes(user?.role)) {
    navigate('/courses');
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested objects
    if (name.startsWith('schedule.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [field]: value
        }
      }));
    } 
    // Handle days array for checkboxes
    else if (name === 'days') {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          days: checked 
            ? [...prev.schedule.days, value]
            : prev.schedule.days.filter(day => day !== value)
        }
      }));
    }
    // Handle boolean fields
    else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    }
    // Handle number fields
    else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    }
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation (from your Course model)
    const requiredFields = [
      'courseCode', 'name', 'courseType', 'duration', 
      'intakeMonth', 'intakeYear', 'batchNumber', 'instructor',
      'maxStudents', 'certification'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = `${field.replace(/([A-Z])/g, ' $1')} is required`;
      }
    });

    // Format validation
    if (formData.courseCode && !/^[A-Z]{3,4}\d{3}$/.test(formData.courseCode.toUpperCase())) {
      newErrors.courseCode = 'Course code must be like DRV101, PLB201, ELC301, COM401';
    }

    if (formData.intakeYear && !/^\d{4}$/.test(formData.intakeYear)) {
      newErrors.intakeYear = 'Year must be 4 digits (e.g., 2024)';
    }

    // Range validation
    if (formData.maxStudents && (formData.maxStudents < 1 || formData.maxStudents > 50)) {
      newErrors.maxStudents = 'Maximum students must be between 1 and 50';
    }

    if (formData.practicalHours && formData.practicalHours < 0) {
      newErrors.practicalHours = 'Practical hours cannot be negative';
    }

    // Schedule validation
    if (!formData.schedule.days.length) newErrors.days = 'At least one day must be selected';
    if (!formData.schedule.time.trim()) newErrors['schedule.time'] = 'Class time is required';
    if (!formData.schedule.room.trim()) newErrors['schedule.room'] = 'Room is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        courseCode: formData.courseCode.toUpperCase() // Ensure uppercase
      };

      const result = await updateCourse(id, submissionData);
      
      if (result.success) {
        toast.success('Course updated successfully!');
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/courses');
  };

  if (loading && !currentCourse) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <Loader className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </Layout>
    );
  }

  if (!currentCourse && !loading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Course not found</h3>
          <p className="mt-1 text-sm text-gray-500">The course you're looking for doesn't exist.</p>
          <button
            onClick={handleCancel}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            Back to Courses
          </button>
        </div>
      </Layout>
    );
  }

  const enrolledCount = currentCourse.enrolledStudents?.length || 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCancel}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="w-8 h-8 mr-3 text-purple-600" />
                  Edit Course
                </h1>
                <p className="mt-2 text-gray-600">
                  Update course information for {currentCourse?.courseCode} - {currentCourse?.name}
                </p>
                {enrolledCount > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Note: {enrolledCount} students are currently enrolled in this course
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                Basic Course Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Code */}
                <div>
                  <label htmlFor="courseCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Code *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="courseCode"
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.courseCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., DRV101, PLB201, ELC301, COM401"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  {errors.courseCode && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.courseCode}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Format: 3-4 letters + 3 numbers
                  </p>
                </div>

                {/* Course Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Defensive Driving Course"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Course Type */}
                <div>
                  <label htmlFor="courseType" className="block text-sm font-medium text-gray-700 mb-2">
                    Course Type *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="courseType"
                      name="courseType"
                      value={formData.courseType}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.courseType ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Course Type</option>
                      {courseTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.courseType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.courseType}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.duration ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Duration</option>
                      {durations.map(duration => (
                        <option key={duration} value={duration}>{duration}</option>
                      ))}
                    </select>
                  </div>
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.duration}
                    </p>
                  )}
                </div>

                {/* Intake Month */}
                <div>
                  <label htmlFor="intakeMonth" className="block text-sm font-medium text-gray-700 mb-2">
                    Intake Month *
                  </label>
                  <select
                    id="intakeMonth"
                    name="intakeMonth"
                    value={formData.intakeMonth}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                      errors.intakeMonth ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Intake Month</option>
                    {intakeMonths.map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                  {errors.intakeMonth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.intakeMonth}
                    </p>
                  )}
                </div>

                {/* Intake Year */}
                <div>
                  <label htmlFor="intakeYear" className="block text-sm font-medium text-gray-700 mb-2">
                    Intake Year *
                  </label>
                  <select
                    id="intakeYear"
                    name="intakeYear"
                    value={formData.intakeYear}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                      errors.intakeYear ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Year</option>
                    {generateYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  {errors.intakeYear && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.intakeYear}
                    </p>
                  )}
                </div>

                {/* Batch Number */}
                <div>
                  <label htmlFor="batchNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    id="batchNumber"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                      errors.batchNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Batch 1, 2024A"
                  />
                  {errors.batchNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.batchNumber}
                    </p>
                  )}
                </div>

                {/* Maximum Students */}
                <div>
                  <label htmlFor="maxStudents" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Students *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      id="maxStudents"
                      name="maxStudents"
                      min="1"
                      max="50"
                      value={formData.maxStudents}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.maxStudents ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.maxStudents && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.maxStudents}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Currently enrolled: {enrolledCount} students
                  </p>
                </div>

                {/* Practical Hours */}
                <div>
                  <label htmlFor="practicalHours" className="block text-sm font-medium text-gray-700 mb-2">
                    Practical Hours
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      id="practicalHours"
                      name="practicalHours"
                      min="0"
                      value={formData.practicalHours}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.practicalHours ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.practicalHours && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.practicalHours}
                    </p>
                  )}
                </div>

                {/* Certification Type */}
                <div>
                  <label htmlFor="certification" className="block text-sm font-medium text-gray-700 mb-2">
                    Certification Type *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="certification"
                      name="certification"
                      value={formData.certification}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.certification ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Certification</option>
                      {certificationTypes.map(cert => (
                        <option key={cert} value={cert}>{cert}</option>
                      ))}
                    </select>
                  </div>
                  {errors.certification && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.certification}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Workshop Required */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="workshopRequired"
                      checked={formData.workshopRequired}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Workshop Required</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    Check if this course requires workshop facilities
                  </p>
                </div>
              </div>

              {/* Course Description */}
              <div className="mt-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Brief description of the course content and objectives..."
                  maxLength="500"
                />
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Requirements */}
              <div className="mt-6">
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-2">
                  Requirements (Optional)
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  rows={2}
                  value={formData.requirements}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Any special requirements for students..."
                  maxLength="200"
                />
                <p className="mt-1 text-xs text-gray-500 text-right">
                  {formData.requirements.length}/200 characters
                </p>
              </div>
            </div>

            {/* Instructor Selection Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-600" />
                Assign Instructor
              </h2>
              
              <div>
                <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
                  Instructor *
                </label>
                {instructorsLoading ? (
                  <div className="flex items-center justify-center p-4 border border-gray-300 rounded-lg">
                    <Loader className="w-5 h-5 animate-spin text-purple-600 mr-2" />
                    <span className="text-gray-600">Loading instructors...</span>
                  </div>
                ) : instructors.length === 0 ? (
                  <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                    <p className="text-yellow-700 text-sm">
                      No instructors available.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="instructor"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors.instructor ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map(instructor => (
                        <option key={instructor._id} value={instructor._id}>
                          {instructor.name} ({instructor.email}) - {instructor.role}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {errors.instructor && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.instructor}
                  </p>
                )}
                {currentCourse.instructor && (
                  <p className="mt-1 text-xs text-gray-500">
                    Current instructor: {currentCourse.instructor.name}
                  </p>
                )}
              </div>
            </div>

            {/* Schedule Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                Schedule Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Days Selection */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Days *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {daysOfWeek.map(day => (
                      <label key={day} className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          name="days"
                          value={day}
                          checked={formData.schedule.days.includes(day)}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                  {errors.days && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.days}
                    </p>
                  )}
                </div>

                {/* Class Time */}
                <div>
                  <label htmlFor="schedule.time" className="block text-sm font-medium text-gray-700 mb-2">
                    Class Time *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="schedule.time"
                      name="schedule.time"
                      value={formData.schedule.time}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors['schedule.time'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 10:00 AM - 12:00 PM"
                    />
                  </div>
                  {errors['schedule.time'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors['schedule.time']}
                    </p>
                  )}
                </div>

                {/* Room */}
                <div>
                  <label htmlFor="schedule.room" className="block text-sm font-medium text-gray-700 mb-2">
                    Room/Location *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="schedule.room"
                      name="schedule.room"
                      value={formData.schedule.room}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                        errors['schedule.room'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Room 101, Computer Lab A"
                      maxLength="50"
                    />
                  </div>
                  {errors['schedule.room'] && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors['schedule.room']}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm flex items-center"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || loading || instructors.length === 0}
                className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center"
              >
                {isSubmitting || loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Updating Course...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Course
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditCourse;