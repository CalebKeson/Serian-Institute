// src/pages/Grades/GradesOverview.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Award,
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { useGradeStore } from '../../stores/gradeStore';
import { useAuthStore } from '../../stores/authStore';
import { useCourseStore } from '../../stores/courseStore';
import GradeTable from '../../components/Grades/GradeTable';
import GradeStatistics from '../../components/Grades/GradeStatistics';
import toast from 'react-hot-toast';

const GradesOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { courses, fetchCourses } = useCourseStore();
  const {
    courseGrades,
    loading,
    fetchCourseGrades,
    clearGrades
  } = useGradeStore();

  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('table'); // 'table' or 'statistics'

  useEffect(() => {
    fetchCourses();
    return () => clearGrades();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseGrades(selectedCourse);
    }
  }, [selectedCourse]);

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleAddGrade = () => {
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    navigate(`/courses/${selectedCourse}?tab=grades`);
  };

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Award className="w-8 h-8 mr-3 text-purple-600" />
            Grades Management
          </h1>
          <p className="mt-2 text-gray-600">
            View and manage grades across all courses
          </p>
        </div>

        {/* Course Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1 max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse}
                onChange={handleCourseChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Choose a course...</option>
                {filteredCourses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.courseCode} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setView('table')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'table'
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Table View
              </button>
              <button
                onClick={() => setView('statistics')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'statistics'
                    ? 'bg-purple-600 text-white'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Statistics
              </button>
              <button
                onClick={handleAddGrade}
                disabled={!selectedCourse}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Grade
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {selectedCourse ? (
          view === 'table' ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <GradeTable
                grades={courseGrades}
                loading={loading}
                onView={(grade) => navigate(`/students/${grade.student?._id}`)}
                onEdit={(grade) => navigate(`/courses/${selectedCourse}?tab=grades`)}
                currentUser={user}
                courseId={selectedCourse}
                showStudentInfo={true}
                showActions={user?.role !== 'student'}
                showFilters={true}
              />
            </div>
          ) : (
            <GradeStatistics courseId={selectedCourse} view="course" />
          )
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Course Selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Please select a course to view grades
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GradesOverview;