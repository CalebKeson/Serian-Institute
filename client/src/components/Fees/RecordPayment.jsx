// src/components/Fees/RecordPayment.jsx - COMPLETE FIXED VERSION

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  CreditCard,
  User,
  BookOpen,
  DollarSign,
  Calendar,
  Smartphone,
  Landmark,
  Wallet,
  FileText,
  CheckCircle,
  AlertCircle,
  Search,
  Loader,
  Receipt,
  Hash,
  Mail,
  Phone,
  Users,
  Info,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import Layout from '../Layout/Layout';
import { usePaymentStore } from '../../stores/paymentStore';
import { useStudentStore } from '../../stores/studentStore';
import { useCourseStore } from '../../stores/courseStore';
import { useEnrollmentStore } from '../../stores/enrollmentStore';
import { useAuthStore } from '../../stores/authStore';
import { formatCurrency, getFeeStatusBadge } from '../../utils/feeFormatter';
import toast from 'react-hot-toast';

const RecordPayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { students, fetchStudents, loading: studentsLoading } = useStudentStore();
  const { fetchStudentWithEnrollments } = useStudentStore();
  const { courses, fetchCourses, loading: coursesLoading } = useCourseStore();
  const { enrollStudent } = useEnrollmentStore();
  const { recordPayment, loading: paymentLoading, fetchStudentFeeSummary } = usePaymentStore();

  // Get URL parameters
  const urlStudentId = searchParams.get('studentId');
  const urlCourseId = searchParams.get('courseId');

  // Form state
  const [step, setStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseFeeDetails, setCourseFeeDetails] = useState(null);
  const [studentFeeData, setStudentFeeData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'mpesa',
    transactionId: '',
    paymentReference: '',
    receiptNumber: '', // REMOVED auto-generation
    paymentFor: 'tuition',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    payerName: '',
    payerRelationship: 'self',
    payerContact: '',
    payerNotes: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isStudentEnrolled, setIsStudentEnrolled] = useState(false);
  const [fetchingEnrollments, setFetchingEnrollments] = useState(false);
  const [fetchingFeeData, setFetchingFeeData] = useState(false);

  const payerRelationships = [
    { value: 'self', label: 'Self (Student)' },
    { value: 'parent', label: 'Parent' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'sponsor', label: 'Sponsor' },
    { value: 'employer', label: 'Employer' },
    { value: 'other', label: 'Other' }
  ];

  // Load students and courses on mount
  useEffect(() => {
    const loadData = async () => {
      setDataLoaded(false);
      try {
        await Promise.all([
          fetchStudents(1, 50, ''),
          fetchCourses(1, 50, '', { status: 'active' })
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      }
    };
    loadData();
  }, []);

  // FIXED: Load student fee summary when a student is selected
  useEffect(() => {
    const loadStudentFees = async () => {
      if (selectedStudent && selectedStudent._id) {
        setFetchingFeeData(true);
        try {
          console.log('Fetching fee summary for student:', selectedStudent._id);
          const result = await fetchStudentFeeSummary(selectedStudent._id);
          console.log('Fee summary result:', result);
          
          if (result.success && result.data) {
            setStudentFeeData(result.data);
            console.log('Student fee data set:', result.data);
          }
        } catch (error) {
          console.error('Error loading student fee summary:', error);
        } finally {
          setFetchingFeeData(false);
        }
      }
    };
    
    if (selectedStudent) {
      loadStudentFees();
    }
  }, [selectedStudent]);

  // Handle URL parameters to pre-select student and course
  useEffect(() => {
    if (!dataLoaded) return;

    const preSelectFromUrl = async () => {
      if (urlStudentId && students.length > 0) {
        const student = students.find(s => 
          s._id === urlStudentId || s.studentId === urlStudentId
        );
        
        if (student) {
          setFetchingEnrollments(true);
          try {
            const result = await fetchStudentWithEnrollments(student._id);
            if (result.success && result.data) {
              setSelectedStudent(result.data);
              
              if (urlCourseId) {
                const course = courses.find(c => c._id === urlCourseId);
                if (course) {
                  await handleCourseSelection(course, result.data);
                  setStep(3);
                } else {
                  setStep(2);
                }
              } else {
                setStep(2);
              }
            }
          } finally {
            setFetchingEnrollments(false);
          }
        }
      } else if (urlCourseId && courses.length > 0) {
        const course = courses.find(c => c._id === urlCourseId);
        if (course) {
          setSelectedCourse(course);
          setStep(2);
        }
      }
    };

    preSelectFromUrl();
  }, [urlStudentId, urlCourseId, students, courses, dataLoaded]);

  // Check enrollment status
  useEffect(() => {
    if (selectedStudent && selectedCourse) {
      const isEnrolled = selectedStudent.enrollments?.some(
        e => e.course === selectedCourse._id || e.courseId === selectedCourse._id
      );
      setIsStudentEnrolled(!!isEnrolled);
    } else {
      setIsStudentEnrolled(false);
    }
  }, [selectedStudent, selectedCourse]);

  // FIXED: Handle course selection - properly get outstanding balance
  const handleCourseSelection = async (course, student) => {
    setSelectedCourse(course);
    
    // Fetch fee details for this student and course
    try {
      // First try to get from already loaded studentFeeData
      let courseFee = null;
      let outstandingAmount = course.price || 0;
      let paidAmount = 0;
      
      if (studentFeeData) {
        // Check different possible structures
        if (studentFeeData.paymentSummary?.courses) {
          courseFee = studentFeeData.paymentSummary.courses.find(
            c => c.courseId === course._id || c.courseCode === course.courseCode
          );
        } else if (studentFeeData.outstandingBalances) {
          courseFee = studentFeeData.outstandingBalances.find(
            c => c.courseId === course._id || c.courseCode === course.courseCode
          );
        } else if (studentFeeData.courses) {
          courseFee = studentFeeData.courses.find(
            c => c.courseId === course._id || c.courseCode === course.courseCode
          );
        }
        
        if (courseFee) {
          paidAmount = courseFee.paid || courseFee.totalPaid || 0;
          outstandingAmount = courseFee.balance || courseFee.remainingBalance || course.price;
          console.log('Found course fee data:', { paidAmount, outstandingAmount });
        }
      }
      
      // If not found in cached data, fetch directly
      if (!courseFee && student?._id) {
        const result = await fetchStudentFeeSummary(student._id);
        if (result.success && result.data) {
          setStudentFeeData(result.data);
          
          if (result.data.paymentSummary?.courses) {
            courseFee = result.data.paymentSummary.courses.find(
              c => c.courseId === course._id || c.courseCode === course.courseCode
            );
          } else if (result.data.outstandingBalances) {
            courseFee = result.data.outstandingBalances.find(
              c => c.courseId === course._id || c.courseCode === course.courseCode
            );
          }
          
          if (courseFee) {
            paidAmount = courseFee.paid || courseFee.totalPaid || 0;
            outstandingAmount = courseFee.balance || courseFee.remainingBalance || course.price;
          }
        }
      }
      
      setCourseFeeDetails({
        courseId: course._id,
        courseCode: course.courseCode,
        courseName: course.name,
        price: course.price,
        paid: paidAmount,
        balance: outstandingAmount,
        percentage: course.price > 0 ? (paidAmount / course.price) * 100 : 0,
        status: outstandingAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid'
      });
      
      // FIXED: Auto-populate amount with outstanding balance
      setFormData(prev => ({ 
        ...prev, 
        amount: outstandingAmount > 0 ? outstandingAmount.toString() : '0'
      }));
      
    } catch (error) {
      console.error('Error fetching fee details:', error);
      setCourseFeeDetails({
        courseId: course._id,
        courseCode: course.courseCode,
        courseName: course.name,
        price: course.price,
        paid: 0,
        balance: course.price,
        percentage: 0,
        status: 'unpaid'
      });
      setFormData(prev => ({ ...prev, amount: course.price?.toString() || '' }));
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSearchTerm('');
    setShowStudentDropdown(false);
    
    setFetchingEnrollments(true);
    try {
      const result = await fetchStudentWithEnrollments(student._id);
      if (result.success && result.data) {
        setSelectedStudent(result.data);
      }
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      toast.error('Failed to fetch student enrollments');
    } finally {
      setFetchingEnrollments(false);
    }
    
    if (selectedCourse) {
      await handleCourseSelection(selectedCourse, student);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleSelectCourse = async (course) => {
    await handleCourseSelection(course, selectedStudent);
    setCourseSearchTerm('');
    setShowCourseDropdown(false);
    setStep(3);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedStudent) newErrors.student = 'Please select a student';
    if (!selectedCourse) newErrors.course = 'Please select a course';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (!formData.receiptNumber) newErrors.receiptNumber = 'Receipt number is required';
    if (!formData.payerName || !formData.payerName.trim()) newErrors.payerName = 'Payer name is required';
    
    if (formData.paymentMethod === 'mpesa' && !formData.transactionId) {
      newErrors.transactionId = 'M-Pesa transaction ID is required';
    }
    if (['cooperative_bank', 'family_bank'].includes(formData.paymentMethod) && !formData.transactionId) {
      newErrors.transactionId = 'Bank reference number is required';
    }
    if (!formData.paymentFor) newErrors.paymentFor = 'Payment purpose is required';
    if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentData = {
        studentId: selectedStudent._id,
        courseId: selectedCourse._id,
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId || undefined,
        paymentReference: formData.paymentReference || undefined,
        receiptNumber: formData.receiptNumber.toUpperCase().trim(),
        paymentFor: formData.paymentFor,
        paymentDate: formData.paymentDate,
        notes: formData.notes || undefined,
        payerName: formData.payerName.trim(),
        payerRelationship: formData.payerRelationship,
        payerContact: formData.payerContact || undefined,
        payerNotes: formData.payerNotes || undefined
      };

      const result = await recordPayment(paymentData);

      if (result.success) {
        const remainingBalance = (courseFeeDetails?.balance || selectedCourse.price) - parseFloat(formData.amount);
        if (remainingBalance > 0) {
          toast.success(`Payment recorded successfully! Remaining balance: ${formatCurrency(remainingBalance)}`);
        } else if (remainingBalance === 0) {
          toast.success('Payment recorded successfully! Course fee is now fully paid! 🎉');
        } else {
          toast.success('Payment recorded successfully!');
        }
        navigate('/fees');
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollAndPay = async () => {
    if (!selectedStudent || !selectedCourse) return;

    setIsSubmitting(true);
    try {
      const enrollResult = await enrollStudent(
        selectedCourse._id,
        selectedStudent._id,
        'Enrolled via payment'
      );
      
      if (enrollResult.success) {
        setIsStudentEnrolled(true);
        await handleSubmit(new Event('submit'));
      } else {
        toast.error('Failed to enroll student');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Failed to enroll student');
      setIsSubmitting(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      student.user?.name?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower) ||
      student.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Filter courses with outstanding balance calculation
  const filteredCourses = courses.map(course => {
    let outstandingBalance = course.price || 0;
    let paidAmount = 0;
    let paymentStatus = 'unpaid';
    
    if (selectedStudent && studentFeeData) {
      let courseFee = null;
      
      if (studentFeeData.paymentSummary?.courses) {
        courseFee = studentFeeData.paymentSummary.courses.find(
          c => c.courseId === course._id || c.courseCode === course.courseCode
        );
      } else if (studentFeeData.outstandingBalances) {
        courseFee = studentFeeData.outstandingBalances.find(
          c => c.courseId === course._id || c.courseCode === course.courseCode
        );
      }
      
      if (courseFee) {
        paidAmount = courseFee.paid || courseFee.totalPaid || 0;
        outstandingBalance = courseFee.balance || courseFee.remainingBalance || course.price;
        paymentStatus = outstandingBalance === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
      }
    }
    
    return {
      ...course,
      outstandingBalance,
      paidAmount,
      paymentStatus
    };
  }).filter(course => {
    if (!courseSearchTerm) return true;
    const searchLower = courseSearchTerm.toLowerCase();
    return (
      course.name?.toLowerCase().includes(searchLower) ||
      course.courseCode?.toLowerCase().includes(searchLower)
    );
  });

  if (!dataLoaded) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate('/fees')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CreditCard className="w-8 h-8 mr-3 text-green-600" />
                Record Payment
              </h1>
              <p className="mt-2 text-gray-600">
                {step === 1 && 'Select a student to record payment for'}
                {step === 2 && 'Select the course for this payment'}
                {step === 3 && 'Enter payment details'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1 ? 'border-green-600 bg-green-50' : 'border-gray-300'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Select Student</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-green-600' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2 ? 'border-green-600 bg-green-50' : 'border-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Select Course</span>
            </div>
            <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 3 ? 'border-green-600 bg-green-50' : 'border-gray-300'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Payment Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Student */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Select Student</h2>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowStudentDropdown(true);
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>

              {showStudentDropdown && (
                <div className="absolute z-10 w-full max-w-2xl mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {fetchingEnrollments ? (
                    <div className="p-8 text-center">
                      <Loader className="w-6 h-6 animate-spin text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Loading student details...</p>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student._id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gradient-to-r from-green-600 to-emerald-700 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-xs">
                              {student.user?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {student.user?.name}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Hash className="w-3 h-3 mr-1" />
                              {student.studentId} • {student.user?.email}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm">No students found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Course - Enhanced with outstanding balance */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Select Course</h2>
                {selectedStudent && (
                  <div className="text-sm text-gray-600">
                    Student: <span className="font-medium">{selectedStudent.user?.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses by code or name..."
                  value={courseSearchTerm}
                  onChange={(e) => {
                    setCourseSearchTerm(e.target.value);
                    setShowCourseDropdown(true);
                  }}
                  onFocus={() => setShowCourseDropdown(true)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  autoFocus
                />
              </div>

              {fetchingFeeData && (
                <div className="text-center py-4">
                  <Loader className="w-6 h-6 animate-spin text-green-600 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">Loading fee data...</p>
                </div>
              )}

              {showCourseDropdown && !fetchingFeeData && filteredCourses.length > 0 && (
                <div className="absolute z-10 w-full max-w-2xl mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {filteredCourses.map((course) => {
                    const isEnrolled = selectedStudent?.enrollments?.some(
                      e => e.course === course._id || e.courseId === course._id
                    );
                    
                    const getStatusBadge = () => {
                      if (course.paymentStatus === 'paid') {
                        return { color: 'bg-green-100 text-green-800', text: 'Fully Paid', icon: CheckCircle };
                      } else if (course.paymentStatus === 'partial') {
                        return { color: 'bg-yellow-100 text-yellow-800', text: 'Partial Payment', icon: AlertCircle };
                      } else {
                        return { color: 'bg-red-100 text-red-800', text: 'Unpaid', icon: AlertTriangle };
                      }
                    };
                    
                    const statusBadge = getStatusBadge();
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <button
                        key={course._id}
                        onClick={() => handleSelectCourse(course)}
                        className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {course.courseCode} - {course.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Duration: {course.duration} • Intake: {course.intakeMonth} {course.intakeYear}
                                {isEnrolled && (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                    ✓ Enrolled
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusBadge.text}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-xs bg-gray-50 p-2 rounded-lg">
                            <div className="text-center">
                              <p className="text-gray-500">Total Fee</p>
                              <p className="font-bold text-gray-900">{formatCurrency(course.price)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Paid</p>
                              <p className="font-bold text-green-600">{formatCurrency(course.paidAmount)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-gray-500">Outstanding</p>
                              <p className={`font-bold ${course.outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {formatCurrency(course.outstandingBalance)}
                              </p>
                            </div>
                          </div>
                          
                          {course.price > 0 && (
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    course.paymentStatus === 'paid' ? 'bg-green-500' :
                                    course.paymentStatus === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${((course.price - course.outstandingBalance) / course.price) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500">
                                {Math.round(((course.price - course.outstandingBalance) / course.price) * 100)}% paid
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {showCourseDropdown && courseSearchTerm && filteredCourses.length === 0 && !fetchingFeeData && (
                <div className="absolute z-10 w-full max-w-2xl mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                  No courses found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Payment Details */}
        {step === 3 && selectedStudent && selectedCourse && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Payment Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Student and Course Summary */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-600 mb-1">Student</p>
                    <p className="font-medium text-gray-900">{selectedStudent.user?.name}</p>
                    <p className="text-sm text-gray-600">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 mb-1">Course</p>
                    <p className="font-medium text-gray-900">{selectedCourse.courseCode}</p>
                    <p className="text-sm text-gray-600">{selectedCourse.name}</p>
                    {isStudentEnrolled && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enrolled
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Fee Balance Summary Card */}
              {courseFeeDetails && (
                <div className={`rounded-lg p-4 border ${
                  courseFeeDetails.balance > 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Current Fee Status</p>
                    <TrendingDown className={`w-4 h-4 ${
                      courseFeeDetails.balance > 0 ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Fee</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formatCurrency(courseFeeDetails.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Paid</p>
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(courseFeeDetails.paid)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Outstanding</p>
                      <p className={`text-sm font-bold ${
                        courseFeeDetails.balance > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(courseFeeDetails.balance)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Number - NO AUTO-GENERATION */}
              <div>
                <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Number *
                </label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    id="receiptNumber"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleChange}
                    placeholder="Enter receipt number from receipt book"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.receiptNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.receiptNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.receiptNumber}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Enter the receipt number from your physical receipt book
                </p>
              </div>

              {/* Amount - Pre-filled with outstanding balance */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.amount}
                  </p>
                )}
                {courseFeeDetails?.balance > 0 && (
                  <p className="mt-1 text-xs text-blue-600">
                    Outstanding balance: {formatCurrency(courseFeeDetails.balance)}
                  </p>
                )}
              </div>

              {/* Payer Information Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  Payer Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="payerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Payer Name *
                    </label>
                    <input
                      type="text"
                      id="payerName"
                      name="payerName"
                      value={formData.payerName}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.payerName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Full name of person making payment"
                    />
                    {errors.payerName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.payerName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="payerRelationship" className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship to Student *
                    </label>
                    <select
                      id="payerRelationship"
                      name="payerRelationship"
                      value={formData.payerRelationship}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      {payerRelationships.map(rel => (
                        <option key={rel.value} value={rel.value}>{rel.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="payerContact" className="block text-sm font-medium text-gray-700 mb-2">
                      Payer Contact (Optional)
                    </label>
                    <input
                      type="text"
                      id="payerContact"
                      name="payerContact"
                      value={formData.payerContact}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Phone number or email"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="payerNotes" className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      id="payerNotes"
                      name="payerNotes"
                      value={formData.payerNotes}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Any additional notes about the payer..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { value: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                    { value: 'cooperative_bank', label: 'Co-op Bank', icon: Landmark },
                    { value: 'family_bank', label: 'Family Bank', icon: Landmark },
                    { value: 'cash', label: 'Cash', icon: Wallet },
                    { value: 'other', label: 'Other', icon: CreditCard }
                  ].map((method) => {
                    const Icon = method.icon;
                    const isSelected = formData.paymentMethod === method.value;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                        className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {errors.paymentMethod && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.paymentMethod}
                  </p>
                )}
              </div>

              {/* Transaction ID */}
              {(formData.paymentMethod === 'mpesa' || 
                formData.paymentMethod === 'cooperative_bank' || 
                formData.paymentMethod === 'family_bank') && (
                <div>
                  <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.paymentMethod === 'mpesa' ? 'M-Pesa Transaction ID' : 'Bank Reference Number'} *
                  </label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="transactionId"
                      name="transactionId"
                      value={formData.transactionId}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        errors.transactionId ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={formData.paymentMethod === 'mpesa' ? 'e.g., QW22G4H5J6' : 'e.g., REF-2024-001'}
                    />
                  </div>
                  {errors.transactionId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.transactionId}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Reference */}
              <div>
                <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  id="paymentReference"
                  name="paymentReference"
                  value={formData.paymentReference}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Internal reference number"
                />
              </div>

              {/* Payment Purpose */}
              <div>
                <label htmlFor="paymentFor" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Purpose *
                </label>
                <select
                  id="paymentFor"
                  name="paymentFor"
                  value={formData.paymentFor}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    errors.paymentFor ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="tuition">Tuition Fee</option>
                  <option value="registration">Registration Fee</option>
                  <option value="exam_fee">Examination Fee</option>
                  <option value="lab_fee">Skills Lab Fee</option>
                  <option value="materials">Learning Materials</option>
                  <option value="other">Other</option>
                </select>
                {errors.paymentFor && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.paymentFor}
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.paymentDate && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.paymentDate}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Any additional notes about this payment..."
                />
              </div>

              {/* Enrollment Warning */}
              {!isStudentEnrolled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Student Not Enrolled</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This student is not currently enrolled in this course. You can enroll them now and record the payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                
                {!isStudentEnrolled ? (
                  <button
                    type="button"
                    onClick={handleEnrollAndPay}
                    disabled={isSubmitting || paymentLoading}
                    className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                  >
                    {isSubmitting || paymentLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Enroll & Record Payment
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || paymentLoading}
                    className="px-6 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
                  >
                    {isSubmitting || paymentLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Record Payment
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecordPayment;