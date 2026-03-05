// src/pages/Attendance/AttendanceCourseSelection.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Calendar,
  Search,
  Filter,
  BookOpen,
  Users,
  User,
  Clock,
  Car,
  Droplets,
  Zap,
  Cpu,
  ChevronRight,
  Loader
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useCourseStore } from '../../stores/courseStore';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const AttendanceCourseSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    courses, 
    loading, 
    fetchCourses,
    pagination 
  } = useCourseStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses(1, 20, '', { 
      status: 'active', // Only show active courses by default
      ...(user?.role === 'instructor' && { instructor: user._id }) // Show only instructor's courses for teachers
    });
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses(1, 20, searchTerm, { 
        courseType: selectedType,
        status: 'active',
        ...(user?.role === 'instructor' && { instructor: user._id })
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, user]);

  const handleSelectCourse = (courseId) => {
    navigate(`/courses/${courseId}/attendance`);
  };

  const getCourseTypeIcon = (courseType) => {
    const icons = {
      driving: Car,
      plumbing: Droplets,
      electrical: Zap,
      computer: Cpu
    };
    return icons[courseType] || BookOpen;
  };

  const getCourseTypeColor = (courseType) => {
    const colors = {
      driving: 'bg-red-100 text-red-600 border-red-200',
      plumbing: 'bg-blue-100 text-blue-600 border-blue-200',
      electrical: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      computer: 'bg-purple-100 text-purple-600 border-purple-200'
    };
    return colors[courseType] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const courseTypes = [
    { value: 'driving', label: 'Driving Classes', icon: Car },
    { value: 'plumbing', label: 'Plumbing', icon: Droplets },
    { value: 'electrical', label: 'Electrical', icon: Zap },
    { value: 'computer', label: 'Computer', icon: Cpu }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-purple-600" />
            Mark Attendance
          </h1>
          <p className="mt-2 text-gray-600">
            Select a course to mark attendance for today's session
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search courses by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter by Type
                {selectedType && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-purple-600 rounded-full">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Type Filter */}
            {showFilters && (
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Type
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedType('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedType === ''
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Types
                  </button>
                  {courseTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedType === type.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-2 text-gray-500">
              {searchTerm || selectedType 
                ? 'Try adjusting your search or filters' 
                : user?.role === 'instructor'
                ? 'You have no active courses assigned to you'
                : 'No active courses available for attendance'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const CourseIcon = getCourseTypeIcon(course.courseType);
              const typeColorClass = getCourseTypeColor(course.courseType);
              const enrolledCount = course.enrolledCount || course.enrolledStudents?.length || 0;
              
              return (
                <div
                  key={course._id}
                  onClick={() => handleSelectCourse(course._id)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="p-6">
                    {/* Header with Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${typeColorClass}`}>
                        <CourseIcon className="w-6 h-6" />
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        course.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>

                    {/* Course Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {course.courseCode}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {course.name}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {enrolledCount} Students
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        {course.instructor?.name?.split(' ')[0] || 'Unassigned'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {course.schedule?.time || 'TBD'}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {course.intakeMonth}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Enrollment</span>
                        <span className="font-medium">
                          {enrolledCount}/{course.maxStudents}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            enrolledCount >= course.maxStudents
                              ? 'bg-red-500'
                              : enrolledCount >= course.maxStudents * 0.8
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{
                            width: `${(enrolledCount / course.maxStudents) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between group-hover:bg-purple-50 transition-colors">
                    <span className="text-sm font-medium text-purple-600">
                      Mark Attendance
                    </span>
                    <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.current} of {pagination.total}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchCourses(pagination.current - 1, pagination.limit, searchTerm, { 
                  courseType: selectedType,
                  status: 'active',
                  ...(user?.role === 'instructor' && { instructor: user._id })
                })}
                disabled={pagination.current === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => fetchCourses(pagination.current + 1, pagination.limit, searchTerm, { 
                  courseType: selectedType,
                  status: 'active',
                  ...(user?.role === 'instructor' && { instructor: user._id })
                })}
                disabled={pagination.current === pagination.total}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Quick Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Today's Date</h4>
              <p className="text-sm text-blue-700 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Select a course to mark attendance for today's session. You can also change the date on the attendance page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceCourseSelection;