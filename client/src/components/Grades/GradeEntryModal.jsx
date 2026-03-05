// src/components/Grades/GradeEntryModal.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  BookOpen,
  FileText,
  Calendar,
  Award,
  Percent,
  Scale,
  AlertCircle,
  Check,
  ChevronDown,
  Loader
} from 'lucide-react';
import { gradeAPI } from '../../services/gradeAPI';
import { useGradeStore } from '../../stores/gradeStore';
import toast from 'react-hot-toast';

const GradeEntryModal = ({
  isOpen,
  onClose,
  onSave,
  grade = null,
  courseId,
  studentId = null,
  students = [],
  loading = false
}) => {
  const { fetchGradingScales, gradingScales } = useGradeStore();

  const [formData, setFormData] = useState({
    student: studentId || '',
    course: courseId || '',
    assessmentType: '',
    assessmentName: '',
    score: '',
    maxScore: 100,
    weight: 1,
    term: '',
    academicYear: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    comments: '',
    isPublished: false,
    isExtraCredit: false
  });

  const [errors, setErrors] = useState({});
  const [calculatedPercentage, setCalculatedPercentage] = useState(null);
  const [predictedGrade, setPredictedGrade] = useState(null);
  const [selectedScale, setSelectedScale] = useState(null);
  const [showScaleSelector, setShowScaleSelector] = useState(false);

  // Assessment types from API helper
  const assessmentTypes = gradeAPI.getAssessmentTypes();
  
  // Terms from API helper
  const terms = gradeAPI.getTerms();
  
  // Academic years from API helper
  const academicYears = gradeAPI.getAcademicYears();

  // Load grading scales on mount
  useEffect(() => {
    if (isOpen) {
      fetchGradingScales();
    }
  }, [isOpen]);

  // Initialize form with grade data if editing
  useEffect(() => {
    if (grade) {
      setFormData({
        student: grade.student?._id || grade.student || '',
        course: grade.course?._id || grade.course || '',
        assessmentType: grade.assessmentType || '',
        assessmentName: grade.assessmentName || '',
        score: grade.score || '',
        maxScore: grade.maxScore || 100,
        weight: grade.weight || 1,
        term: grade.term || '',
        academicYear: grade.academicYear || '',
        assessmentDate: grade.assessmentDate 
          ? new Date(grade.assessmentDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        comments: grade.comments || '',
        isPublished: grade.isPublished || false,
        isExtraCredit: grade.isExtraCredit || false
      });
    } else {
      // Reset form for new grade
      setFormData({
        student: studentId || '',
        course: courseId || '',
        assessmentType: '',
        assessmentName: '',
        score: '',
        maxScore: 100,
        weight: 1,
        term: '',
        academicYear: '',
        assessmentDate: new Date().toISOString().split('T')[0],
        comments: '',
        isPublished: false,
        isExtraCredit: false
      });
    }
    setErrors({});
    setCalculatedPercentage(null);
    setPredictedGrade(null);
  }, [grade, studentId, courseId, isOpen]);

  // Calculate percentage when score or maxScore changes
  useEffect(() => {
    if (formData.score && formData.maxScore && formData.maxScore > 0) {
      const percentage = (parseFloat(formData.score) / parseFloat(formData.maxScore)) * 100;
      setCalculatedPercentage(percentage.toFixed(1));
      
      // Predict letter grade based on default scale
      const letterGrade = gradeAPI.calculateLetterGrade(percentage);
      setPredictedGrade(letterGrade);
    } else {
      setCalculatedPercentage(null);
      setPredictedGrade(null);
    }
  }, [formData.score, formData.maxScore]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle number input changes
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : parseFloat(value);
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));

    // Validate score doesn't exceed max
    if (name === 'score' && formData.maxScore && numValue > formData.maxScore) {
      setErrors(prev => ({
        ...prev,
        score: `Score cannot exceed ${formData.maxScore}`
      }));
    } else if (name === 'maxScore' && formData.score && formData.score > numValue) {
      setErrors(prev => ({
        ...prev,
        score: `Score cannot exceed ${numValue}`
      }));
    } else {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.student) newErrors.student = 'Student is required';
    if (!formData.assessmentType) newErrors.assessmentType = 'Assessment type is required';
    if (!formData.assessmentName.trim()) newErrors.assessmentName = 'Assessment name is required';
    if (!formData.score && formData.score !== 0) newErrors.score = 'Score is required';
    if (!formData.maxScore) newErrors.maxScore = 'Maximum score is required';
    if (!formData.term) newErrors.term = 'Term is required';
    if (!formData.academicYear) newErrors.academicYear = 'Academic year is required';
    if (!formData.assessmentDate) newErrors.assessmentDate = 'Assessment date is required';

    // Numeric validations
    if (formData.score !== '' && formData.score < 0) {
      newErrors.score = 'Score cannot be negative';
    }
    
    if (formData.maxScore && formData.maxScore < 1) {
      newErrors.maxScore = 'Maximum score must be at least 1';
    }
    
    if (formData.score !== '' && formData.maxScore && formData.score > formData.maxScore) {
      newErrors.score = `Score cannot exceed ${formData.maxScore}`;
    }
    
    if (formData.weight && (formData.weight < 0 || formData.weight > 100)) {
      newErrors.weight = 'Weight must be between 0 and 100';
    }

    // Date validation
    const selectedDate = new Date(formData.assessmentDate);
    const today = new Date();
    if (selectedDate > today) {
      newErrors.assessmentDate = 'Assessment date cannot be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Convert string numbers to actual numbers
      const submitData = {
        ...formData,
        score: parseFloat(formData.score),
        maxScore: parseFloat(formData.maxScore),
        weight: parseFloat(formData.weight) || 1
      };
      
      onSave(submitData);
    }
  };

  // Handle quick fill with common values
  const handleQuickFill = (type) => {
    const fills = {
      quiz: { assessmentType: 'quiz', maxScore: 10, weight: 1 },
      assignment: { assessmentType: 'assignment', maxScore: 100, weight: 1 },
      midterm: { assessmentType: 'midterm', maxScore: 100, weight: 2 },
      final: { assessmentType: 'final', maxScore: 100, weight: 3 },
      project: { assessmentType: 'project', maxScore: 50, weight: 1.5 }
    };

    if (fills[type]) {
      setFormData(prev => ({
        ...prev,
        ...fills[type]
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {grade ? 'Edit Grade' : 'Enter New Grade'}
              </h2>
              <p className="text-sm text-gray-600">
                {grade ? 'Update existing grade record' : 'Add a new grade for student'}
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

        {/* Quick Fill Buttons (for new grades) */}
        {!grade && (
          <div className="mb-6">
            <p className="text-xs text-gray-500 mb-2">Quick fill templates:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickFill('quiz')}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
              >
                Quiz
              </button>
              <button
                onClick={() => handleQuickFill('assignment')}
                className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full hover:bg-green-200 transition-colors"
              >
                Assignment
              </button>
              <button
                onClick={() => handleQuickFill('midterm')}
                className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full hover:bg-purple-200 transition-colors"
              >
                Midterm
              </button>
              <button
                onClick={() => handleQuickFill('final')}
                className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full hover:bg-red-200 transition-colors"
              >
                Final
              </button>
              <button
                onClick={() => handleQuickFill('project')}
                className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full hover:bg-orange-200 transition-colors"
              >
                Project
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div className="md:col-span-2">
              <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
                Student *
              </label>
              {students.length > 0 ? (
                <select
                  id="student"
                  name="student"
                  value={formData.student}
                  onChange={handleChange}
                  disabled={!!studentId}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                    errors.student ? 'border-red-300' : 'border-gray-300'
                  } ${studentId ? 'bg-gray-100' : ''}`}
                >
                  <option value="">Select a student</option>
                  {students.map(student => (
                    <option key={student._id} value={student._id}>
                      {student.user?.name} ({student.studentId})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.student}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                  placeholder="Student ID will be auto-filled"
                />
              )}
              {errors.student && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.student}
                </p>
              )}
            </div>

            {/* Assessment Type */}
            <div>
              <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Type *
              </label>
              <select
                id="assessmentType"
                name="assessmentType"
                value={formData.assessmentType}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.assessmentType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select type</option>
                {assessmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.assessmentType && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.assessmentType}
                </p>
              )}
            </div>

            {/* Assessment Name */}
            <div>
              <label htmlFor="assessmentName" className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Name *
              </label>
              <input
                type="text"
                id="assessmentName"
                name="assessmentName"
                value={formData.assessmentName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.assessmentName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Chapter 1 Quiz, Final Exam"
              />
              {errors.assessmentName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.assessmentName}
                </p>
              )}
            </div>

            {/* Score */}
            <div>
              <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-2">
                Score *
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="score"
                  name="score"
                  value={formData.score}
                  onChange={handleNumberChange}
                  step="0.1"
                  min="0"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                    errors.score ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.0"
                />
              </div>
              {errors.score && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.score}
                </p>
              )}
            </div>

            {/* Max Score */}
            <div>
              <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 mb-2">
                Max Score *
              </label>
              <input
                type="number"
                id="maxScore"
                name="maxScore"
                value={formData.maxScore}
                onChange={handleNumberChange}
                step="0.1"
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.maxScore ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="100"
              />
              {errors.maxScore && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.maxScore}
                </p>
              )}
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleNumberChange}
                step="0.1"
                min="0"
                max="100"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.weight ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1.0"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.weight}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Higher weight = more impact on final grade
              </p>
            </div>

            {/* Term */}
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
                Term *
              </label>
              <select
                id="term"
                name="term"
                value={formData.term}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.term ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select term</option>
                {terms.map(term => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
              {errors.term && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.term}
                </p>
              )}
            </div>

            {/* Academic Year */}
            <div>
              <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year *
              </label>
              <select
                id="academicYear"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.academicYear ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select year</option>
                {academicYears.map(year => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
              {errors.academicYear && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.academicYear}
                </p>
              )}
            </div>

            {/* Assessment Date */}
            <div>
              <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Date *
              </label>
              <input
                type="date"
                id="assessmentDate"
                name="assessmentDate"
                value={formData.assessmentDate}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
                  errors.assessmentDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.assessmentDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.assessmentDate}
                </p>
              )}
            </div>

            {/* Calculated Percentage Display */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Percent className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-800">Calculated Percentage</span>
                </div>
                {calculatedPercentage && (
                  <span className={`text-lg font-bold ${
                    calculatedPercentage >= 90 ? 'text-green-600' :
                    calculatedPercentage >= 80 ? 'text-blue-600' :
                    calculatedPercentage >= 70 ? 'text-yellow-600' :
                    calculatedPercentage >= 60 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {calculatedPercentage}%
                  </span>
                )}
              </div>
              
              {predictedGrade && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800">Predicted Grade</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    predictedGrade.startsWith('A') ? 'bg-green-100 text-green-700' :
                    predictedGrade.startsWith('B') ? 'bg-blue-100 text-blue-700' :
                    predictedGrade.startsWith('C') ? 'bg-yellow-100 text-yellow-700' :
                    predictedGrade.startsWith('D') ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {predictedGrade}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Add any notes about this assessment..."
              maxLength="500"
            />
            <p className="mt-1 text-xs text-gray-500 text-right">
              {formData.comments.length}/500 characters
            </p>
          </div>

          {/* Publishing Options */}
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Publish immediately</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isExtraCredit"
                checked={formData.isExtraCredit}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Extra credit</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {grade ? 'Update Grade' : 'Save Grade'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GradeEntryModal;