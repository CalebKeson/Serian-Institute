// frontend/src/pages/Instructor/StudentFeeDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, DollarSign, Calendar, CreditCard, User, Mail, Phone } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { formatCurrency } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const StudentFeeDetails = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [student, setStudent] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadStudentFeeDetails();
  }, [studentId]);
  
  const loadStudentFeeDetails = async () => {
    setLoading(true);
    try {
      // Fetch student details
      const studentRes = await fetch(`/api/students/${studentId}`);
      const studentData = await studentRes.json();
      
      // Fetch student fee summary
      const feeRes = await fetch(`/api/payments/student/${studentId}/summary`);
      const feeData = await feeRes.json();
      
      if (studentData.success) {
        setStudent(studentData.data);
      }
      
      if (feeData.success) {
        setFeeSummary(feeData.data.summary);
        setCourseBreakdown(feeData.data.courseBreakdown || []);
        setRecentPayments(feeData.data.recentPayments || []);
      }
    } catch (error) {
      console.error('Failed to load student fee details:', error);
      toast.error('Failed to load fee details');
      
      // Set mock data for demonstration
      setStudent({
        user: { name: 'John Doe', email: 'john.doe@example.com' },
        studentId: 'STU-001',
        phone: '0712345678'
      });
      setFeeSummary({
        totalFees: 150000,
        totalPaid: 75000,
        outstandingBalance: 75000,
        paymentPercentage: 50
      });
      setCourseBreakdown([
        {
          course: { courseCode: 'CNA101', name: 'Introduction to Nursing', price: 75000 },
          totalPaid: 50000,
          remainingBalance: 25000,
          paymentPercentage: 67
        },
        {
          course: { courseCode: 'CNA102', name: 'Patient Care Basics', price: 75000 },
          totalPaid: 25000,
          remainingBalance: 50000,
          paymentPercentage: 33
        }
      ]);
      setRecentPayments([
        { amount: 25000, paymentDate: '2026-04-15', paymentMethod: 'mpesa', course: { name: 'Introduction to Nursing' } },
        { amount: 25000, paymentDate: '2026-04-01', paymentMethod: 'bank_transfer', course: { name: 'Patient Care Basics' } },
        { amount: 25000, paymentDate: '2026-03-15', paymentMethod: 'mpesa', course: { name: 'Introduction to Nursing' } }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const getPaymentMethodDisplay = (method) => {
    const methods = {
      mpesa: 'M-Pesa',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      cheque: 'Cheque'
    };
    return methods[method] || method;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
              Student Fee Details
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View fee payment status and history for {student?.user?.name}
            </p>
          </div>
        </div>
        
        {/* Student Information Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {student?.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{student?.user?.name}</h2>
                <p className="text-sm text-gray-500">Student ID: {student?.studentId}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Mail className="w-3 h-3" /> {student?.user?.email}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3 h-3" /> {student?.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Student Since</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(student?.enrollmentDate)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Fee Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Fees</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(feeSummary?.totalFees || 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Paid</span>
              <CreditCard className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(feeSummary?.totalPaid || 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Outstanding</span>
              <DollarSign className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(feeSummary?.outstandingBalance || 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Payment Rate</span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(feeSummary?.paymentPercentage || 0)}%
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div 
                className="bg-green-600 rounded-full h-1.5"
                style={{ width: `${feeSummary?.paymentPercentage || 0}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Course Breakdown Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Course Fee Breakdown</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Fees</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseBreakdown.length > 0 ? (
                  courseBreakdown.map((course, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{course.course?.courseCode}</p>
                          <p className="text-xs text-gray-500">{course.course?.name}</p>
                        </div>
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(course.course?.price || 0)}
                       </td>
                      <td className="px-6 py-4 text-sm text-green-600">
                        {formatCurrency(course.totalPaid || 0)}
                       </td>
                      <td className="px-6 py-4 text-sm text-orange-600">
                        {formatCurrency(course.remainingBalance || 0)}
                       </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          course.remainingBalance === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.remainingBalance === 0 ? 'Paid' : 'Pending'}
                        </span>
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No course fee records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Recent Payments Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Payments</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                 </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(payment.paymentDate)}
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {payment.course?.name || 'N/A'}
                       </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getPaymentMethodDisplay(payment.paymentMethod)}
                       </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {payment.transactionId || payment.paymentReference || '-'}
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Disclaimer for Instructors */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            ℹ️ This is a read-only view. For any fee discrepancies or payment issues, 
            please contact the finance department.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default StudentFeeDetails;