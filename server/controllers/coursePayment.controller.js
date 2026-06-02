import Course from '../models/course.model.js';
import Student from '../models/student.model.js';
import Payment from '../models/payment.model.js';
import StudentFee from '../models/studentFee.model.js';
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';

// @desc    Get payment summary for a specific course
// @route   GET /api/courses/:courseId/payments/summary
// @access  Private (Admin, Instructor)
export const getCoursePaymentSummary = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get all enrolled students for this course
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'enrolled'
    }).populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

    const enrolledStudents = enrollments.map(e => e.student);

    // Get all payments for this course
    const payments = await Payment.find({
      course: courseId,
      status: 'completed'
    }).populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name'
      }
    }).sort({ paymentDate: -1 });

    // Calculate course totals
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const expectedRevenue = course.price * enrolledStudents.length;
    const outstandingBalance = Math.max(0, expectedRevenue - totalCollected);
    const collectionPercentage = expectedRevenue > 0 
      ? Math.round((totalCollected / expectedRevenue) * 100) 
      : 0;

    // Payment method breakdown
    const paymentMethods = {};
    payments.forEach(p => {
      const method = p.paymentMethod;
      if (!paymentMethods[method]) {
        paymentMethods[method] = {
          count: 0,
          total: 0,
          methodDisplay: p.paymentMethodDisplay
        };
      }
      paymentMethods[method].count++;
      paymentMethods[method].total += p.amount;
    });

    // Payment purpose breakdown
    const paymentPurposes = {};
    payments.forEach(p => {
      const purpose = p.paymentFor;
      if (!paymentPurposes[purpose]) {
        paymentPurposes[purpose] = {
          count: 0,
          total: 0,
          purposeDisplay: p.paymentForDisplay
        };
      }
      paymentPurposes[purpose].count++;
      paymentPurposes[purpose].total += p.amount;
    });

    // Monthly collection trend
    const monthlyData = await Payment.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(courseId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          monthName: {
            $let: {
              vars: {
                months: ["", "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"]
              },
              in: { $arrayElemAt: ["$$months", "$_id.month"] }
            }
          },
          total: 1,
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        courseInfo: {
          id: course._id,
          code: course.courseCode,
          name: course.name,
          price: course.price,
          formattedPrice: course.formattedPrice,
          enrolledStudents: enrolledStudents.length,
          maxStudents: course.maxStudents
        },
        financialSummary: {
          expectedRevenue,
          totalCollected,
          outstandingBalance,
          collectionPercentage,
          averagePerStudent: enrolledStudents.length > 0 
            ? Math.round(totalCollected / enrolledStudents.length) 
            : 0
        },
        paymentMethods: Object.values(paymentMethods),
        paymentPurposes: Object.values(paymentPurposes),
        monthlyTrend: monthlyData,
        recentPayments: payments.slice(0, 10)
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// backend/controllers/coursePayment.controller.js - UPDATE getCourseStudentsPaymentStatus function

export const getCourseStudentsPaymentStatus = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { status, search } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // IMPORTANT: Populate student with phone field
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'enrolled'
    }).populate({
      path: 'student',
      select: 'studentId phone user', // ADD phone to select
      populate: {
        path: 'user',
        select: 'name email'
      }
    });

    const studentIds = enrollments.map(e => e.student._id);
    const studentFees = await StudentFee.find({
      student: { $in: studentIds }
    }).populate('courses.payments');

    const feeMap = {};
    studentFees.forEach(fee => {
      feeMap[fee.student.toString()] = fee;
    });

    let studentsList = enrollments.map(enrollment => {
      const student = enrollment.student;
      const feeRecord = feeMap[student._id.toString()];
      
      let courseFee = null;
      if (feeRecord) {
        courseFee = feeRecord.courses.find(
          c => c.course.toString() === courseId
        );
      }

      const coursePayments = courseFee?.payments || [];
      const totalPaid = courseFee?.totalPaid || 0;
      const balance = Math.max(0, course.price - totalPaid);
      const percentage = course.price > 0 
        ? Math.round((totalPaid / course.price) * 100) 
        : 0;

      let paymentStatus = 'unpaid';
      if (totalPaid >= course.price) {
        paymentStatus = totalPaid > course.price ? 'overpaid' : 'paid';
      } else if (totalPaid > 0) {
        paymentStatus = 'partial';
      }

      return {
        studentId: student._id,
        studentNumber: student.studentId || 'N/A',  // ADD THIS
        studentName: student.user?.name || 'Unknown',
        studentEmail: student.user?.email,
        phone: student.user?.phone || 'N/A',  // ADD THIS - phone from Student model
        admissionNumber: enrollment.admissionNumber,
        enrollmentDate: enrollment.enrollmentDate,
        payment: {
          coursePrice: course.price,
          totalPaid,
          balance,
          percentage,
          status: paymentStatus,
          lastPaymentDate: courseFee?.lastPaymentDate,
          paymentsCount: coursePayments.length
        },
        recentPayments: coursePayments.slice(0, 3).map(p => ({
          id: p._id,
          amount: p.amount,
          formattedAmount: `KSh ${p.amount.toLocaleString()}`,
          date: p.paymentDate,
          method: p.paymentMethodDisplay,
          purpose: p.paymentForDisplay,
          transactionId: p.transactionId
        }))
      };
    });

    // Apply filters
    if (status) {
      studentsList = studentsList.filter(s => s.payment.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      studentsList = studentsList.filter(s => 
        s.studentName.toLowerCase().includes(searchLower) ||
        (s.studentNumber && s.studentNumber.toLowerCase().includes(searchLower)) ||
        s.studentEmail.toLowerCase().includes(searchLower)
      );
    }

    const summary = {
      totalStudents: studentsList.length,
      paid: studentsList.filter(s => s.payment.status === 'paid').length,
      partial: studentsList.filter(s => s.payment.status === 'partial').length,
      unpaid: studentsList.filter(s => s.payment.status === 'unpaid').length,
      overpaid: studentsList.filter(s => s.payment.status === 'overpaid').length,
      totalCollected: studentsList.reduce((sum, s) => sum + s.payment.totalPaid, 0),
      totalExpected: studentsList.length * course.price,
      averagePercentage: studentsList.length > 0
        ? Math.round(studentsList.reduce((sum, s) => sum + s.payment.percentage, 0) / studentsList.length)
        : 0
    };

    summary.outstandingBalance = summary.totalExpected - summary.totalCollected;

    res.json({
      success: true,
      data: {
        courseCode: course.courseCode,
        courseName: course.name,
        students: studentsList,
        summary: {
          totalStudents: studentsList.length,
          totalFees: summary.totalExpected,
          totalPaid: summary.totalCollected,
          totalBalance: summary.outstandingBalance,
          collectionRate: summary.totalExpected > 0 ? (summary.totalCollected / summary.totalExpected) * 100 : 0,
          paymentStatus: {
            fullyPaid: summary.paid,
            partial: summary.partial,
            unpaid: summary.unpaid
          }
        }
      }
    });

  } catch (error) {
    console.error('Get course students payment status error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get payment details for a specific student in a course
// @route   GET /api/courses/:courseId/students/:studentId/payments
// @access  Private (Admin, Instructor, Student)
export const getStudentCoursePayments = async (req, res, next) => {
  try {
    const { courseId, studentId } = req.params;

    // Check permissions
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== studentId) {
        return next(errorHandler(403, 'Access denied'));
      }
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Check if student exists and is enrolled
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    }).populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    });

    if (!enrollment) {
      return next(errorHandler(404, 'Student not enrolled in this course'));
    }

    // Get all payments for this student in this course
    const payments = await Payment.find({
      student: studentId,
      course: courseId,
      status: 'completed'
    }).sort({ paymentDate: -1 });

    // Get student fee record
    const studentFee = await StudentFee.findOne({ student: studentId });
    let courseFee = null;
    if (studentFee) {
      courseFee = studentFee.courses.find(
        c => c.course.toString() === courseId
      );
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, course.price - totalPaid);
    const percentage = course.price > 0 
      ? Math.round((totalPaid / course.price) * 100) 
      : 0;

    // Payment method breakdown for this student
    const methodBreakdown = {};
    payments.forEach(p => {
      if (!methodBreakdown[p.paymentMethod]) {
        methodBreakdown[p.paymentMethod] = {
          method: p.paymentMethodDisplay,
          total: 0,
          count: 0
        };
      }
      methodBreakdown[p.paymentMethod].total += p.amount;
      methodBreakdown[p.paymentMethod].count++;
    });

    // Payment timeline
    const timeline = await Payment.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          course: new mongoose.Types.ObjectId(courseId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        studentInfo: {
          id: enrollment.student._id,
          studentNumber: enrollment.student.studentId,
          name: enrollment.student.user?.name,
          email: enrollment.student.user?.email,
          phone: enrollment.student.phone
        },
        courseInfo: {
          id: course._id,
          code: course.courseCode,
          name: course.name,
          price: course.price,
          formattedPrice: course.formattedPrice
        },
        paymentSummary: {
          totalPaid,
          balance,
          percentage,
          status: totalPaid >= course.price ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid',
          paymentsCount: payments.length,
          lastPaymentDate: courseFee?.lastPaymentDate,
          remainingAmount: balance
        },
        methodBreakdown: Object.values(methodBreakdown),
        timeline,
        payments: payments.map(p => ({
          id: p._id,
          amount: p.amount,
          formattedAmount: `KSh ${p.amount.toLocaleString()}`,
          date: p.paymentDate,
          method: p.paymentMethodDisplay,
          purpose: p.paymentForDisplay,
          transactionId: p.transactionId,
          reference: p.paymentReference,
          notes: p.notes,
          recordedBy: p.recordedBy
        }))
      }
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// @desc    Export course payment report as CSV
// @route   GET /api/courses/:courseId/payments/export
// @access  Private (Admin, Instructor)
export const exportCoursePaymentReport = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { format = 'csv' } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return next(errorHandler(404, 'Course not found'));
    }

    // Get all enrolled students with payment data
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'enrolled'
    }).populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name email phone'
      }
    });

    // Get all payments for this course
    const payments = await Payment.find({
      course: courseId,
      status: 'completed'
    }).populate({
      path: 'student',
      populate: {
        path: 'user',
        select: 'name'
      }
    });

    // Prepare CSV data
    const csvData = enrollments.map(enrollment => {
      const student = enrollment.student;
      const studentPayments = payments.filter(
        p => p.student._id.toString() === student._id.toString()
      );
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, course.price - totalPaid);
      const percentage = course.price > 0 
        ? Math.round((totalPaid / course.price) * 100) 
        : 0;

      return {
        'Student ID': student.studentId,
        'Student Name': student.user?.name || 'Unknown',
        'Email': student.user?.email || '',
        'Phone': student.phone || '',
        'Enrollment Date': new Date(enrollment.enrollmentDate).toLocaleDateString(),
        'Course Price': course.price,
        'Total Paid': totalPaid,
        'Balance': balance,
        'Percentage': `${percentage}%`,
        'Status': totalPaid >= course.price ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid',
        'Last Payment Date': studentPayments.length > 0 
          ? new Date(Math.max(...studentPayments.map(p => p.paymentDate))).toLocaleDateString()
          : 'N/A',
        'Payments Count': studentPayments.length
      };
    });

    if (format === 'csv') {
      const { Parser } = await import('json2csv');
      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=${course.courseCode}_payment_report_${new Date().toISOString().split('T')[0]}.csv`
      );
      return res.send(csv);
    }

    res.json({
      success: true,
      data: csvData
    });

  } catch (error) {
    next(errorHandler(500, error.message));
  }
};