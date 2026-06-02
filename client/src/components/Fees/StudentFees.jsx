// src/components/Fees/StudentFees.jsx - FIXED NaN ISSUE

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  User,
  DollarSign,
  CreditCard,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  PieChart,
  Receipt,
  Printer,
  Mail,
  Users,
  Hash,
  Phone,
  BookOpen,
  UserCheck
} from 'lucide-react';
import Layout from '../Layout/Layout';
import { usePaymentStore } from '../../stores/paymentStore';
import { useStudentStore } from '../../stores/studentStore';
import { useAuthStore } from '../../stores/authStore';
import {
  formatCurrency,
  calculateProgress,
  getProgressColor,
  getFeeStatusBadge,
  formatDate
} from '../../utils/feeFormatter';
import FeeBreakdown from './FeeBreakdown';
import PaymentHistoryTable from './PaymentHistoryTable';
import ExportButtons from './ExportButtons';
import { studentFeesExportConfig } from '../../utils/exportConfigs';
import toast from 'react-hot-toast';

const StudentFees = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { user } = useAuthStore();
  const { currentStudent, fetchStudentWithEnrollments, loading: studentLoading } = useStudentStore();
  const {
    studentFeeSummary,
    fetchStudentFeeSummary,
    fetchPayments,
    payments,
    loading,
    exportPayments
  } = usePaymentStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');
  const [totalFees, setTotalFees] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: ''
  });

  // Load student data on mount
  useEffect(() => {
    if (studentId) {
      loadStudentData();
    }
  }, [studentId]);

  // Process fee summary data and create course breakdown
  useEffect(() => {
    console.log('Student Fee Summary:', studentFeeSummary);
    
    if (studentFeeSummary) {
      let summaryData = null;
      let coursesData = null;
      
      // Extract summary data
      if (studentFeeSummary.summary) {
        summaryData = studentFeeSummary.summary;
        coursesData = studentFeeSummary.courseBreakdown;
      } else if (studentFeeSummary.data && studentFeeSummary.data.summary) {
        summaryData = studentFeeSummary.data.summary;
        coursesData = studentFeeSummary.data.courseBreakdown;
      } else if (studentFeeSummary.paymentSummary) {
        summaryData = studentFeeSummary.paymentSummary;
        coursesData = studentFeeSummary.courseBreakdown;
      } else if (studentFeeSummary.totalFees !== undefined) {
        summaryData = studentFeeSummary;
        coursesData = studentFeeSummary.courses || studentFeeSummary.courseBreakdown;
      }
      
      if (summaryData) {
        setTotalFees(summaryData.totalFees || 0);
        setTotalPaid(summaryData.totalPaid || 0);
        setOutstandingBalance(summaryData.totalBalance || 0);
        // Calculate percentage as a number (not string with %)
        const percentage = summaryData.totalFees > 0 
          ? Math.round((summaryData.totalPaid / summaryData.totalFees) * 100) 
          : 0;
        setOverallPercentage(percentage);
      }
      
      // Create course breakdown from the data
      let breakdown = [];
      
      if (coursesData && Array.isArray(coursesData) && coursesData.length > 0) {
        breakdown = coursesData;
      } else if (studentFeeSummary.courses && Array.isArray(studentFeeSummary.courses)) {
        breakdown = studentFeeSummary.courses;
      } else if (summaryData && summaryData.courses && Array.isArray(summaryData.courses)) {
        breakdown = summaryData.courses;
      } else if (currentStudent?.enrollments && currentStudent.enrollments.length > 0) {
        breakdown = currentStudent.enrollments.map(enrollment => ({
          courseId: enrollment.courseId,
          courseCode: enrollment.courseCode,
          courseName: enrollment.courseName,
          price: enrollment.coursePrice || 0,
          paid: enrollment.totalPaid || 0,
          balance: enrollment.balance || (enrollment.coursePrice || 0),
          percentage: enrollment.paymentPercentage || 0,
          status: enrollment.status === 'enrolled' ? (enrollment.balance === 0 ? 'paid' : 'partial') : 'unpaid'
        }));
      }
      
      const formattedBreakdown = breakdown.map(course => ({
        courseId: course.courseId || course.course?._id,
        courseCode: course.courseCode || course.course?.courseCode,
        courseName: course.courseName || course.course?.name,
        price: course.price || course.coursePrice || 0,
        paid: course.paid || course.totalPaid || 0,
        balance: course.balance || course.remainingBalance || 0,
        percentage: course.percentage || course.paymentPercentage || 0,
        status: course.status || (course.balance === 0 ? 'paid' : course.paid > 0 ? 'partial' : 'unpaid'),
        lastPaymentDate: course.lastPaymentDate,
        paymentsCount: course.paymentsCount || 0
      }));
      
      setCourseBreakdown(formattedBreakdown);
    }
  }, [studentFeeSummary, currentStudent]);

  // Set student info when currentStudent loads
  useEffect(() => {
    if (currentStudent) {
      setStudentInfo({
        name: currentStudent.user?.name || 'N/A',
        studentId: currentStudent.studentId || 'Not assigned',
        email: currentStudent.user?.email || 'N/A',
        phone: currentStudent.phone || 'N/A'
      });
    }
  }, [currentStudent]);

  const loadStudentData = async () => {
    await Promise.all([
      fetchStudentWithEnrollments(studentId),
      fetchStudentFeeSummary(studentId),
      fetchPayments({ studentId, limit: 100 })
    ]);
  };

  const handleRefresh = () => {
    loadStudentData();
    toast.success('Data refreshed');
  };

  const handleBack = () => {
    navigate('/fees');
  };

  const handleRecordPayment = (course = null) => {
    const params = new URLSearchParams();
    params.append('studentId', studentId);
    if (course) {
      params.append('courseId', course.courseId);
    }
    navigate(`/fees/record-payment?${params.toString()}`);
  };

  const handleExport = async (format, options) => {
    const result = await exportPayments({ 
      studentId,
      format,
      startDate: options.dateRange?.startDate,
      endDate: options.dateRange?.endDate
    });
    if (result.success) {
      toast.success(`Student fees exported as ${format.toUpperCase()}`);
    }
    return result;
  };

  const handlePrintReceipt = (payment) => {
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #059669; }
            .receipt-title { font-size: 20px; margin: 20px 0; text-align: center; }
            .details { border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Serian Institute</div>
            <div>Official Payment Receipt</div>
          </div>
          
          <div class="receipt-title">Receipt #${payment.receiptNumber || payment._id?.slice(-8)}</div>
          
          <div class="details">
            <div class="row">
              <span>Date:</span>
              <span>${new Date(payment.paymentDate).toLocaleDateString()}</span>
            </div>
            <div class="row">
              <span>Student Name:</span>
              <span>${currentStudent?.user?.name}</span>
            </div>
            <div class="row">
              <span>Student ID:</span>
              <span>${currentStudent?.studentId}</span>
            </div>
            <div class="row">
              <span>Course:</span>
              <span>${payment.course?.name}</span>
            </div>
            <div class="row">
              <span>Payment Method:</span>
              <span>${payment.paymentMethodDisplay}</span>
            </div>
            <div class="row">
              <span>Transaction ID:</span>
              <span>${payment.transactionId || 'N/A'}</span>
            </div>
            <div class="row total">
              <span>Amount Paid:</span>
              <span>${formatCurrency(payment.amount)}</span>
            </div>
            <div class="row">
              <span>Purpose:</span>
              <span>${payment.paymentForDisplay}</span>
            </div>
            <div class="row">
              <span>Recorded By:</span>
              <span>${payment.recordedBy?.name || 'System'}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>This is a computer-generated receipt. No signature required.</p>
            <p>Thank you for your payment!</p>
          </div>
        </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.print();
  };

  const handleSendReceipt = (payment) => {
    toast.success(`Receipt sent to student email: ${currentStudent?.user?.email}`);
  };

  // Filter payments by date range
  const filteredPayments = (Array.isArray(payments) ? payments : []).filter(payment => {
    if (dateRange === 'all') return true;
    
    const paymentDate = new Date(payment.paymentDate);
    const now = new Date();
    
    switch (dateRange) {
      case 'month':
        return paymentDate > new Date(now.setMonth(now.getMonth() - 1));
      case 'quarter':
        return paymentDate > new Date(now.setMonth(now.getMonth() - 3));
      case 'year':
        return paymentDate > new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return true;
    }
  });

  // Prepare export data for Student Fees Report
  const exportData = filteredPayments.map(payment => ({
    date: new Date(payment.paymentDate).toLocaleDateString(),
    course: payment.course?.name || 'N/A',
    amount: payment.amount,
    receiptNumber: payment.receiptNumber || 'N/A',
    paidBy: payment.payerName || 'N/A',
    method: payment.paymentMethodDisplay || payment.paymentMethod,
    recordedBy: payment.recordedBy?.name || 'System',
    status: payment.status || 'completed'
  }));

  // Prepare custom summary data for export - keep as raw numbers for the export component
  const customSummaryData = {
    studentName: studentInfo.name,
    studentId: studentInfo.studentId,
    studentEmail: studentInfo.email,
    studentPhone: studentInfo.phone,
    totalFees: totalFees,
    totalPaid: totalPaid,
    balance: outstandingBalance,
    paymentProgress: overallPercentage  // Pass as number, not string
  };

  // Dynamic config for student fees export
  const dynamicConfig = {
    ...studentFeesExportConfig,
    title: `${studentInfo.name} - Fee Statement`,
    filename: `student_fees_${studentId}`,
    columns: [
      { header: 'Date', accessor: 'date', width: 12, type: 'date' },
      { header: 'Course', accessor: 'course', width: 25 },
      { header: 'Amount (KSh)', accessor: 'amount', width: 15, type: 'currency' },
      { header: 'Receipt Number', accessor: 'receiptNumber', width: 15 },
      { header: 'Paid By', accessor: 'paidBy', width: 20 },
      { header: 'Method', accessor: 'method', width: 15 },
      { header: 'Recorded By', accessor: 'recordedBy', width: 20 },
      { header: 'Status', accessor: 'status', width: 12 }
    ],
    summaryFields: [
      { label: 'Student Name', value: studentInfo.name, format: 'text' },
      { label: 'Student ID', value: studentInfo.studentId, format: 'text' },
      { label: 'Student Email', value: studentInfo.email, format: 'text' },
      { label: 'Student Phone', value: studentInfo.phone, format: 'text' },
      { label: 'Total Fees', value: totalFees, format: 'currency' },
      { label: 'Total Paid', value: totalPaid, format: 'currency' },
      { label: 'Balance', value: outstandingBalance, format: 'currency' },
      { label: 'Payment Progress', value: overallPercentage, format: 'percentage' }  // Pass raw number, ExportButtons will add %
    ]
  };

  if (studentLoading || !currentStudent) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  const progressPercentage = calculateProgress(totalPaid, totalFees);
  const progressColor = getProgressColor(progressPercentage);
  const statusBadge = getFeeStatusBadge(
    outstandingBalance === 0 ? 'paid' : 
    totalPaid > 0 ? 'partial' : 'unpaid'
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <User className="w-8 h-8 mr-3 text-green-600" />
                  Student Fee Management
                </h1>
                <p className="mt-2 text-gray-600">
                  {currentStudent.user?.name} • {currentStudent.studentId}
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <ExportButtons
                data={exportData}
                config={dynamicConfig}
                filename={`student_fees_${studentId}`}
                formats={['csv', 'excel', 'pdf', 'print', 'email']}
                includeDateRange={true}
                buttonStyle="default"
                buttonText="Export Statement"
                customSummaryData={customSummaryData}
              />

              <button
                onClick={() => handleRecordPayment()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 transition-all shadow-sm hover:shadow-md"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Record Payment
              </button>
            </div>
          </div>
        </div>

        {/* Student Summary Card */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {currentStudent.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {currentStudent.user?.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    ID: {currentStudent.studentId}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {currentStudent.user?.email}
                  </span>
                  <span className="text-sm text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {currentStudent.phone || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className={`mt-4 md:mt-0 px-4 py-2 rounded-lg ${statusBadge.color}`}>
              <span className="text-sm font-medium">
                {statusBadge.icon} {statusBadge.label}
              </span>
            </div>
          </div>
        </div>

        {/* Fee Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Total Fees</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(totalFees)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Total Paid</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Balance</p>
            <p className={`text-3xl font-bold ${
              outstandingBalance === 0 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {formatCurrency(outstandingBalance)}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-2">Payment Progress</p>
            <p className="text-3xl font-bold text-purple-600">
              {overallPercentage}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Payment Progress
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(totalPaid)} / {formatCurrency(totalFees)} ({overallPercentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex -mb-px space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PieChart className="w-4 h-4 inline mr-2" />
              Fee Breakdown
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Receipt className="w-4 h-4 inline mr-2" />
              Payment History
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'analytics'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <FeeBreakdown
              courses={courseBreakdown}
              onRecordPayment={handleRecordPayment}
              studentId={studentId}
              showActions={true}
            />
            
            {courseBreakdown.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-yellow-700">No course fee breakdown available. This student may not have any enrolled courses or fee records.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Time</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
            </div>

            <PaymentHistoryTable
              payments={filteredPayments}
              loading={loading}
              onPrint={handlePrintReceipt}
              onSendEmail={handleSendReceipt}
              showStudentInfo={false}
              showCourseInfo={true}
              showActions={true}
              showPayerInfo={true}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Payment Analytics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Payment Timeline
                </h4>
                <div className="space-y-3">
                  {filteredPayments.slice(0, 5).map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(payment.paymentDate)}
                        </p>
                        {payment.payerName && (
                          <p className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Users className="w-3 h-3 mr-1" />
                            Paid by: {payment.payerName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Recorded by: {payment.recordedBy?.name || 'System'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                        {payment.receiptNumber && (
                          <p className="text-xs text-gray-400 mt-1">
                            Receipt: {payment.receiptNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">
                  Payment Statistics
                </h4>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Average Payment</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(filteredPayments.length > 0 ? totalPaid / filteredPayments.length : 0)}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-600 mb-1">Largest Payment</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {formatCurrency(Math.max(...filteredPayments.map(p => p.amount), 0))}
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 mb-1">Payment Frequency</p>
                    <p className="text-2xl font-bold text-green-700">
                      {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <AlertCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="text-sm font-medium text-green-800">Need help?</h4>
                <p className="text-xs text-green-600">
                  Contact the finance office for any payment inquiries
                </p>
              </div>
            </div>
            <button
              onClick={() => window.open('mailto:finance@serian.ac.ke')}
              className="inline-flex items-center px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contact Finance
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentFees;