// frontend/src/components/Instructor/CourseFeeSummary.jsx
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Eye } from 'lucide-react';
import { formatCurrency } from '../../utils/feeFormatter';
import { usePaymentStore } from '../../stores/paymentStore';

const CourseFeeSummary = ({ courseId, courseName, courseCode, onViewDetails }) => {
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    outstandingBalance: 0,
    collectionRate: 0,
    studentCount: 0,
    students: []
  });
  const [loading, setLoading] = useState(true);
  const { fetchCoursePaymentSummary } = usePaymentStore();
  
  useEffect(() => {
    loadFeeSummary();
  }, [courseId]);
  
  const loadFeeSummary = async () => {
    setLoading(true);
    try {
      // Fetch course payment summary from API
      const response = await fetch(`/api/courses/${courseId}/payments/summary`);
      const data = await response.json();
      
      if (data.success) {
        setSummary({
          totalExpected: data.data.expectedRevenue || 0,
          totalCollected: data.data.totalCollected || 0,
          outstandingBalance: data.data.outstandingBalance || 0,
          collectionRate: data.data.collectionPercentage || 0,
          studentCount: data.data.courseInfo?.enrolledStudents || 0,
          students: data.data.students || []
        });
      }
    } catch (error) {
      console.error('Failed to load fee summary:', error);
      // Set mock data for demonstration
      setSummary({
        totalExpected: 500000,
        totalCollected: 350000,
        outstandingBalance: 150000,
        collectionRate: 70,
        studentCount: 25,
        students: []
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-600" />
          <h3 className="font-medium text-gray-900 text-sm">Fee Collection</h3>
        </div>
        <button
          onClick={() => onViewDetails && onViewDetails(courseId)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <Eye className="w-3 h-3" /> Details
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Total Expected</span>
          <span className="font-medium text-gray-900">{formatCurrency(summary.totalExpected)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Collected</span>
          <span className="font-medium text-green-600">{formatCurrency(summary.totalCollected)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Outstanding</span>
          <span className="font-medium text-orange-600">{formatCurrency(summary.outstandingBalance)}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Collection Rate</span>
            <span className="font-medium text-gray-900">{summary.collectionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-600 rounded-full h-1.5 transition-all duration-500"
              style={{ width: `${summary.collectionRate}%` }}
            />
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-100 text-center">
          <span className="text-xs text-gray-500">
            {summary.studentCount} students enrolled
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseFeeSummary;