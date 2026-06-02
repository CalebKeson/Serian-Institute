// backend/controllers/payment.controller.js - COMPLETE UPDATED VERSION

import Payment from '../models/payment.model.js';
import StudentFee from '../models/studentFee.model.js';
import Course from '../models/course.model.js';
import Student from '../models/student.model.js'; 
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';
import { createIncomeFromPayment } from '../services/incomeService.js';

// @desc    Record a new payment (UPDATED with payer info and receipt number)
// @route   POST /api/payments
// @access  Private (Admin, Receptionist)
export const recordPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      studentId,
      courseId,
      amount,
      paymentMethod,
      transactionId,
      paymentReference,
      receiptNumber,
      paymentFor,
      paymentDate,
      notes,
      payerName,
      payerRelationship,
      payerContact,
      payerNotes
    } = req.body;

    // Validate required fields
    if (!studentId || !courseId || !amount || !paymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Student, course, amount, and payment method are required'));
    }

    // Validate payer name
    if (!payerName) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Payer name is required'));
    }

    // Validate receipt number
    if (!receiptNumber) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Receipt number is required'));
    }

    // Check if student exists
    const student = await Student.findById(studentId)
      .populate('user', 'name email')
      .session(session);
    
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Student not found'));
    }

    // Check if course exists
    const course = await Course.findById(courseId).session(session);
    if (!course) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Course not found'));
    }

    // Check if student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      status: 'enrolled'
    }).session(session);

    if (!enrollment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Student is not enrolled in this course'));
    }

    // Check for duplicate receipt number
    const existingReceipt = await Payment.findOne({ 
      receiptNumber: receiptNumber.toUpperCase().trim() 
    }).session(session);
    
    if (existingReceipt) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Receipt number already exists'));
    }

    // Check for duplicate transaction ID if provided
    if (transactionId) {
      const existingTransaction = await Payment.findOne({ 
        transactionId: transactionId.toUpperCase().trim() 
      }).session(session);
      
      if (existingTransaction) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, 'Transaction ID already exists'));
      }
    }

    // Create payment record with new fields
    const [payment] = await Payment.create([{
      student: studentId,
      enrollment: enrollment._id,
      course: courseId,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId: transactionId ? transactionId.toUpperCase().trim() : undefined,
      paymentReference: paymentReference || undefined,
      receiptNumber: receiptNumber.toUpperCase().trim(),
      paymentFor: paymentFor || 'tuition',
      paymentDate: paymentDate || new Date(),
      notes: notes || undefined,
      recordedBy: req.user._id,
      status: 'completed',
      // New fields
      payerName: payerName.trim(),
      payerRelationship: payerRelationship || 'self',
      payerContact: payerContact || undefined,
      payerNotes: payerNotes || undefined
    }], { session });

    // Create income transaction
    try {
      await createIncomeFromPayment(payment, course, student, req.user._id, session);
      console.log(`✅ Income transaction created for payment: ${payment._id}`);
    } catch (incomeError) {
      console.error('❌ Failed to create income transaction:', incomeError);
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(500, 'Payment processing failed: Unable to create income record'));
    }

    // Update or create student fee record
    await StudentFee.updateAfterPayment(studentId, courseId, payment._id, amount, session);

    await session.commitTransaction();
    session.endSession();

    // Get updated outstanding balances for response
    const outstandingBalances = await Payment.getStudentOutstandingBalances(studentId);
    const paymentSummary = await Payment.getStudentPaymentSummary(studentId);

    // Populate payment for response
    const populatedPayment = await Payment.findById(payment._id)
      .populate({
        path: 'student',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name price')
      .populate('recordedBy', 'name email');

    // Send notifications
    try {
      const studentName = student.user?.name || 'Student';
      const courseName = course.name;
      const formattedAmount = `KSh ${amount.toLocaleString()}`;
      const paymentMethodDisplay = {
        mpesa: 'M-Pesa',
        cooperative_bank: 'Co-operative Bank',
        family_bank: 'Family Bank',
        cash: 'Cash',
        bank_transfer: 'Bank Transfer'
      }[paymentMethod] || paymentMethod;

      // Notify admins
      await NotificationService.createForRole('admin', {
        title: '💰 New Payment Received',
        message: `Payment of ${formattedAmount} received from ${studentName} for ${courseName}. Payer: ${payerName} (${payerRelationship}). Receipt: ${receiptNumber}`,
        type: 'payment',
        actionUrl: `/payments/${payment._id}`
      });

      // Notify the student
      if (student.user) {
        await NotificationService.createNotification({
          recipientId: student.user._id,
          title: '✅ Payment Confirmed',
          message: `Your payment of ${formattedAmount} via ${paymentMethodDisplay} has been received for ${courseName}. Receipt Number: ${receiptNumber}. Thank you for your payment!`,
          type: 'payment',
          actionUrl: `/fees`
        });
      }

      // Notify instructor
      const courseWithInstructor = await Course.findById(courseId).populate('instructor', 'name email');
      if (courseWithInstructor?.instructor) {
        await NotificationService.createNotification({
          recipientId: courseWithInstructor.instructor._id,
          title: '💰 Student Payment',
          message: `${studentName} has made a payment of ${formattedAmount} for ${courseName}. Receipt: ${receiptNumber}`,
          type: 'payment',
          actionUrl: `/courses/${courseId}/enrollments`
        });
      }

    } catch (notificationError) {
      console.error('Failed to send payment notifications:', notificationError);
    }

    res.status(201).json({
      success: true,
      data: {
        payment: populatedPayment,
        outstandingBalances,
        paymentSummary
      },
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Payment recording error:', error);
    
    if (error.code === 11000) {
      const field = error.message.includes('receiptNumber') ? 'Receipt number' : 'Transaction ID';
      return next(errorHandler(400, `${field} already exists`));
    }
    
    next(errorHandler(500, error.message));
  }
};

// @desc    Get all payments with filters
// @route   GET /api/payments
// @access  Private (Admin, Receptionist, Instructor)
export const getPayments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      studentId,
      courseId,
      paymentMethod,
      paymentFor,
      startDate,
      endDate,
      status = 'completed',
      search,
      payerName
    } = req.query;

    const query = { status };

    // Apply filters
    if (studentId) query.student = studentId;
    if (courseId) query.course = courseId;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentFor) query.paymentFor = paymentFor;
    if (payerName) query.payerName = { $regex: payerName, $options: 'i' };
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Search by receipt number, transaction ID, or reference
    if (search) {
      query.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } },
        { paymentReference: { $regex: search, $options: 'i' } },
        { payerName: { $regex: search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(query)
      .populate({
        path: 'student',
        select: 'studentId',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name')
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Calculate total amount for the filtered results
    const totalAmountResult = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        results: total,
        limit: parseInt(limit)
      },
      summary: {
        totalAmount: totalAmountResult.length > 0 ? totalAmountResult[0].total : 0
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get a single payment
// @route   GET /api/payments/:id
// @access  Private
export const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'student',
        select: 'studentId phone address',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name price')
      .populate('recordedBy', 'name email');

    if (!payment) {
      return next(errorHandler(404, 'Payment not found'));
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Get payment error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Update a payment
// @route   PUT /api/payments/:id
// @access  Private (Admin only)
export const updatePayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { 
      amount, 
      notes, 
      status, 
      receiptNumber,
      payerName,
      payerRelationship,
      payerContact,
      payerNotes 
    } = req.body;

    const payment = await Payment.findById(id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('course', 'courseCode name')
      .session(session);
    
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Payment not found'));
    }

    // Check for duplicate receipt number if being changed
    if (receiptNumber && receiptNumber !== payment.receiptNumber) {
      const existingReceipt = await Payment.findOne({ 
        receiptNumber: receiptNumber.toUpperCase().trim(),
        _id: { $ne: id }
      }).session(session);
      
      if (existingReceipt) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, 'Receipt number already exists'));
      }
    }

    // Store old values for comparison
    const oldAmount = payment.amount;
    const oldStatus = payment.status;

    // Track changes for notification
    const changes = [];
    if (amount && amount !== oldAmount) {
      changes.push(`amount changed from KSh ${oldAmount.toLocaleString()} to KSh ${amount.toLocaleString()}`);
      payment.amount = amount;
    }
    if (receiptNumber && receiptNumber !== payment.receiptNumber) {
      changes.push(`receipt number changed from ${payment.receiptNumber} to ${receiptNumber}`);
      payment.receiptNumber = receiptNumber.toUpperCase().trim();
    }
    if (payerName && payerName !== payment.payerName) {
      changes.push(`payer name changed from ${payment.payerName} to ${payerName}`);
      payment.payerName = payerName;
    }
    if (payerRelationship && payerRelationship !== payment.payerRelationship) {
      changes.push(`payer relationship changed from ${payment.payerRelationshipDisplay} to ${payerRelationship}`);
      payment.payerRelationship = payerRelationship;
    }
    if (notes) payment.notes = notes;
    if (payerContact) payment.payerContact = payerContact;
    if (payerNotes) payment.payerNotes = payerNotes;
    if (status && status !== oldStatus) {
      changes.push(`status changed from ${oldStatus} to ${status}`);
      payment.status = status;
    }

    await payment.save({ session });

    // If amount or status changed, update StudentFee
    if (amount !== oldAmount || status !== oldStatus) {
      const studentFee = await StudentFee.findOne({ 
        student: payment.student._id 
      }).session(session);

      if (studentFee) {
        const courseIndex = studentFee.courses.findIndex(
          c => c.course.toString() === payment.course._id.toString()
        );

        if (courseIndex !== -1) {
          if (status === 'refunded') {
            studentFee.courses[courseIndex].totalPaid -= payment.amount;
          } else if (amount !== oldAmount) {
            const diff = parseFloat(amount) - parseFloat(oldAmount);
            studentFee.courses[courseIndex].totalPaid += diff;
          }
          await studentFee.save({ session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    // Send notifications for updates
    if (changes.length > 0 && payment.student?.user) {
      try {
        await NotificationService.createNotification({
          recipientId: payment.student.user._id,
          title: '📝 Payment Updated',
          message: `Your payment record has been updated. Changes: ${changes.join(', ')}. If you have questions, please contact the finance office.`,
          type: 'payment',
          actionUrl: `/fees`
        });

        await NotificationService.createForRole('admin', {
          title: '📝 Payment Record Updated',
          message: `Payment record for ${payment.student.user.name} was updated by ${req.user.name || 'an admin'}. Changes: ${changes.join(', ')}`,
          type: 'payment',
          actionUrl: `/payments/${payment._id}`
        });
      } catch (notificationError) {
        console.error('Failed to send update notifications:', notificationError);
      }
    }

    res.json({
      success: true,
      data: payment,
      message: 'Payment updated successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Update payment error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get student fee summary (for dropdown - shows outstanding balances)
// @route   GET /api/payments/student/:studentId/summary
// @access  Private
export const getStudentFeeSummary = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Check permissions
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      if (!student || student._id.toString() !== studentId) {
        return next(errorHandler(403, 'Access denied'));
      }
    }

    // Get outstanding balances for dropdown
    const outstandingBalances = await Payment.getStudentOutstandingBalances(studentId);
    
    // Get full payment summary
    const paymentSummary = await Payment.getStudentPaymentSummary(studentId);

    res.json({
      success: true,
      data: {
        outstandingBalances,
        paymentSummary,
        hasOutstanding: outstandingBalances.some(c => c.remainingBalance > 0),
        totalOutstanding: outstandingBalances.reduce((sum, c) => sum + c.remainingBalance, 0)
      }
    });

  } catch (error) {
    console.error('Get student fee summary error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private (Admin only)
export const deletePayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('course', 'courseCode name')
      .session(session);
    
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Payment not found'));
    }

    const studentName = payment.student?.user?.name || 'Student';
    const amount = payment.amount;
    const courseName = payment.course?.name || 'Course';
    const receiptNumber = payment.receiptNumber;

    // Remove from StudentFee
    const studentFee = await StudentFee.findOne({ 
      student: payment.student._id 
    }).session(session);

    if (studentFee) {
      const courseIndex = studentFee.courses.findIndex(
        c => c.course.toString() === payment.course._id.toString()
      );

      if (courseIndex !== -1) {
        studentFee.courses[courseIndex].payments = 
          studentFee.courses[courseIndex].payments.filter(
            p => p.toString() !== id
          );
        
        const remainingPayments = await Payment.find({
          _id: { $in: studentFee.courses[courseIndex].payments },
          status: 'completed'
        }).session(session);

        studentFee.courses[courseIndex].totalPaid = 
          remainingPayments.reduce((sum, p) => sum + p.amount, 0);

        await studentFee.save({ session });
      }
    }

    // Delete the payment
    await payment.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    // Send notifications
    try {
      await NotificationService.createForRole('admin', {
        title: '🗑️ Payment Record Deleted',
        message: `Payment of KSh ${amount.toLocaleString()} (Receipt: ${receiptNumber}) from ${studentName} for ${courseName} was deleted by ${req.user.name || 'an admin'}.`,
        type: 'payment',
        actionUrl: '/payments'
      });

      if (payment.student?.user) {
        await NotificationService.createNotification({
          recipientId: payment.student.user._id,
          title: '⚠️ Payment Record Removed',
          message: `Your payment record of KSh ${amount.toLocaleString()} (Receipt: ${receiptNumber}) for ${courseName} has been removed from the system. If you believe this is an error, please contact the finance office immediately.`,
          type: 'alert',
          actionUrl: `/fees`
        });
      }
    } catch (notificationError) {
      console.error('Failed to send deletion notifications:', notificationError);
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete payment error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private (Admin, Instructor)
export const getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await Payment.getPaymentStats(startDate, endDate);

    res.json({
      success: true,
      data: stats[0] || {
        totalStats: [{ totalAmount: 0, totalPayments: 0, averageAmount: 0, minAmount: 0, maxAmount: 0 }],
        byMethod: [],
        byRelationship: [],
        byDay: [],
        byMonth: [],
        recentPayments: []
      }
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Export payments as CSV
// @route   GET /api/payments/export
// @access  Private (Admin)
export const exportPayments = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      paymentMethod,
      courseId,
      format = 'csv'
    } = req.query;

    const query = { status: 'completed' };
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }
    
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (courseId) query.course = courseId;

    const payments = await Payment.find(query)
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate('course', 'courseCode name')
      .sort({ paymentDate: -1 });

    // Prepare CSV data with new fields
    const csvData = payments.map(p => ({
      'Date': new Date(p.paymentDate).toLocaleDateString(),
      'Receipt Number': p.receiptNumber,
      'Student Name': p.student?.user?.name || 'N/A',
      'Student ID': p.student?.studentId || 'N/A',
      'Course Code': p.course?.courseCode || 'N/A',
      'Course Name': p.course?.name || 'N/A',
      'Amount': p.amount,
      'Payment Method': p.paymentMethodDisplay,
      'Purpose': p.paymentForDisplay,
      'Payer Name': p.payerName,
      'Payer Relationship': p.payerRelationshipDisplay,
      'Payer Contact': p.payerContact || 'N/A',
      'Transaction ID': p.transactionId || 'N/A',
      'Reference': p.paymentReference || 'N/A',
      'Notes': p.notes || ''
    }));

    if (format === 'csv') {
      const { Parser } = await import('json2csv');
      const parser = new Parser();
      const csv = parser.parse(csvData);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=payments_export_${new Date().toISOString().split('T')[0]}.csv`
      );
      return res.send(csv);
    }

    res.json({
      success: true,
      data: csvData
    });

  } catch (error) {
    console.error('Export payments error:', error);
    next(errorHandler(500, error.message));
  }
};

// @desc    Send overdue fee reminder to student
// @route   POST /api/payments/student/:studentId/remind
// @access  Private (Admin only)
export const sendOverdueReminder = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { courseId, customMessage } = req.body;

    const student = await Student.findById(studentId).populate('user', 'name email');
    if (!student) {
      return next(errorHandler(404, 'Student not found'));
    }

    const outstandingBalances = await Payment.getStudentOutstandingBalances(studentId);
    
    let targetCourses = outstandingBalances;
    if (courseId) {
      targetCourses = targetCourses.filter(c => c.courseId.toString() === courseId);
    }

    const overdueCourses = targetCourses.filter(c => c.remainingBalance > 0);
    
    if (overdueCourses.length === 0) {
      return next(errorHandler(400, 'No outstanding fees found for this student'));
    }

    const totalOutstanding = overdueCourses.reduce((sum, c) => sum + c.remainingBalance, 0);
    const courseList = overdueCourses.map(c => `${c.courseName}: KSh ${c.remainingBalance.toLocaleString()}`).join('\n');

    const message = customMessage || `Dear ${student.user.name},\n\nThis is a friendly reminder that you have outstanding fee balances for the following courses:\n\n${courseList}\n\nTotal Outstanding: KSh ${totalOutstanding.toLocaleString()}\n\nPlease make your payment as soon as possible to avoid any disruptions.\n\nThank you for your prompt attention to this matter.\n\n- Finance Office, Serian Institute`;

    await NotificationService.createNotification({
      recipientId: student.user._id,
      title: '💰 Fee Payment Reminder',
      message: message,
      type: 'alert',
      actionUrl: `/fees`
    });

    await NotificationService.createForRole('admin', {
      title: '📧 Fee Reminder Sent',
      message: `Fee reminder sent to ${student.user.name} for ${overdueCourses.length} course(s). Total outstanding: KSh ${totalOutstanding.toLocaleString()}`,
      type: 'payment',
      actionUrl: `/students/${studentId}`
    });

    res.json({
      success: true,
      message: `Reminder sent to ${student.user.name}`,
      data: {
        studentName: student.user.name,
        coursesNotified: overdueCourses.length,
        totalOutstanding
      }
    });

  } catch (error) {
    console.error('Send overdue reminder error:', error);
    next(errorHandler(500, error.message));
  }
};