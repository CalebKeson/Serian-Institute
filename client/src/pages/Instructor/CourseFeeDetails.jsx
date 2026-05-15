// frontend/src/pages/Instructor/CourseFeeDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, DollarSign, Download, Users, TrendingUp } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const CourseFeeDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    totalExpected: 0,
    totalCollected: 0,
    outstandingBalance: 0,
    collectionRate: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadFeeDetails();
  }, [courseId]);
  
  const loadFeeDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/payments/students`);
      const data = await response.json();
      
      if (data.success) {
        setCourse(data.data.courseInfo);
        setStudents(data.data.students || []);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to load fee details:', error);
      toast.error('Failed to load fee details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewStudentFees = (studentId) => {
    navigate(`/instructor/students/${studentId}/fees`);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Fee Collection: {course?.code} - {course?.name}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View fee collection summary and individual student payment status
            </p>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Expected</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpected)}</p>
            <p className="text-xs text-gray-500 mt-1">Based on {summary.totalStudents || 0} students</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Collected</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCollected)}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Outstanding</span>
              <DollarSign className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.outstandingBalance)}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Collection Rate</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{summary.collectionRate}%</p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-green-600 rounded-full h-1.5"
                style={{ width: `${summary.collectionRate}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Students Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Student Payment Status</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.studentNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(student.financials?.coursePrice || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(student.financials?.totalPaid || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      {formatCurrency(student.financials?.balance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        student.financials?.status === 'paid' ? 'bg-green-100 text-green-800' :
                        student.financials?.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.financials?.status || 'unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewStudentFees(student.studentId)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseFeeDetails;