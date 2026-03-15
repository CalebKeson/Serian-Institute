// controllers/payment.controller.js
import Payment from '../models/payment.model.js';
import StudentFee from '../models/studentFee.model.js';
import Course from '../models/course.model.js';
import Student from '../models/student.model.js'; 
import Enrollment from '../models/enrollment.model.js';
import { errorHandler } from '../utils/error.js';
import mongoose from 'mongoose';
import NotificationService from '../services/notificationService.js';

// @desc    Record a new payment
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
      paymentFor,
      paymentDate,
      notes
    } = req.body;

    // Validate required fields
    if (!studentId || !courseId || !amount || !paymentMethod) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(400, 'Student, course, amount, and payment method are required'));
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

    // Check for duplicate transaction ID if provided
    if (transactionId) {
      const existingPayment = await Payment.findOne({ 
        transactionId: transactionId.toUpperCase().trim() 
      }).session(session);
      
      if (existingPayment) {
        await session.abortTransaction();
        session.endSession();
        return next(errorHandler(400, 'Transaction ID already exists'));
      }
    }

    // Create payment record
    const [payment] = await Payment.create([{
      student: studentId,
      enrollment: enrollment._id,
      course: courseId,
      amount: parseFloat(amount),
      paymentMethod,
      transactionId: transactionId ? transactionId.toUpperCase().trim() : undefined,
      paymentReference: paymentReference || undefined,
      paymentFor: paymentFor || 'tuition',
      paymentDate: paymentDate || new Date(),
      notes: notes || undefined,
      recordedBy: req.user._id,
      status: 'completed'
    }], { session });

    // Update or create student fee record - FIXED: Pass session correctly
    await StudentFee.updateAfterPayment(studentId, courseId, payment._id, amount, session);

    await session.commitTransaction();
    session.endSession();

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

    // Send notifications (don't fail if notifications fail)
    try {
      const studentName = student.user?.name || 'Student';
      const courseName = course.name;

      // Notify admins
      await NotificationService.createForRole('admin', {
        title: '💰 New Payment Recorded',
        message: `Payment of KSh ${amount.toLocaleString()} received from ${studentName} for ${courseName}.`,
        type: 'payment',
        actionUrl: `/payments/${payment._id}`
      });

      // Notify the student
      if (student.user) {
        const paymentMethodDisplay = {
          mpesa: 'M-Pesa',
          cooperative_bank: 'Co-operative Bank',
          family_bank: 'Family Bank',
          cash: 'Cash'
        }[paymentMethod] || paymentMethod;

        await NotificationService.createNotification({
          recipientId: student.user._id,
          title: '✅ Payment Received',
          message: `Your payment of KSh ${amount.toLocaleString()} via ${paymentMethodDisplay} has been received for ${courseName}. Thank you!`,
          type: 'payment',
          actionUrl: `/fees`
        });
      }
    } catch (notificationError) {
      console.error('Failed to send payment notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json({
      success: true,
      data: populatedPayment,
      message: 'Payment recorded successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Payment recording error:', error);
    
    if (error.code === 11000) {
      return next(errorHandler(400, 'Duplicate transaction ID'));
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
      search
    } = req.query;

    const query = { status };

    // Apply filters
    if (studentId) query.student = studentId;
    if (courseId) query.course = courseId;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (paymentFor) query.paymentFor = paymentFor;
    
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Search by transaction ID or reference
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { paymentReference: { $regex: search, $options: 'i' } }
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
    const { amount, notes, status } = req.body;

    const payment = await Payment.findById(id).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Payment not found'));
    }

    // Store old amount for recalculation
    const oldAmount = payment.amount;
    const oldStatus = payment.status;

    // Update payment
    if (amount) payment.amount = amount;
    if (notes) payment.notes = notes;
    if (status) payment.status = status;

    await payment.save({ session });

    // If amount or status changed, update StudentFee
    if (amount !== oldAmount || status !== oldStatus) {
      const studentFee = await StudentFee.findOne({ 
        student: payment.student 
      }).session(session);

      if (studentFee) {
        const courseIndex = studentFee.courses.findIndex(
          c => c.course.toString() === payment.course.toString()
        );

        if (courseIndex !== -1) {
          // Adjust the total paid
          if (status === 'refunded') {
            studentFee.courses[courseIndex].totalPaid -= payment.amount;
          } else if (amount !== oldAmount) {
            studentFee.courses[courseIndex].totalPaid += (parseFloat(amount) - parseFloat(oldAmount));
          }

          await studentFee.save({ session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

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

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private (Admin only)
export const deletePayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).session(session);
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return next(errorHandler(404, 'Payment not found'));
    }

    // Remove from StudentFee
    const studentFee = await StudentFee.findOne({ 
      student: payment.student 
    }).session(session);

    if (studentFee) {
      const courseIndex = studentFee.courses.findIndex(
        c => c.course.toString() === payment.course.toString()
      );

      if (courseIndex !== -1) {
        // Remove this payment from the payments array
        studentFee.courses[courseIndex].payments = 
          studentFee.courses[courseIndex].payments.filter(
            p => p.toString() !== id
          );
        
        // Recalculate total paid
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

// @desc    Get student fee summary
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

    // Find or create student fee record - FIXED: Use the static method correctly
    let studentFee = await StudentFee.findOne({ student: studentId })
      .populate({
        path: 'courses.course',
        select: 'courseCode name price duration instructor'
      })
      .populate({
        path: 'courses.payments',
        // options: { sort: { paymentDate: -1 } }
      });

    if (!studentFee) {
      // Create new fee record if it doesn't exist
      studentFee = await StudentFee.create({
        student: studentId,
        courses: []
      });
    }

    res.json({
      success: true,
      data: {
        summary: studentFee.paymentSummary,
        courseBreakdown: studentFee.courseBreakdown,
        courses: studentFee.courses
      }
    });

  } catch (error) {
    console.error('Get student fee summary error:', error);
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
        byPurpose: [],
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

    // Prepare CSV data
    const csvData = payments.map(p => ({
      'Date': new Date(p.paymentDate).toLocaleDateString(),
      'Student Name': p.student?.user?.name || 'N/A',
      'Student ID': p.student?.studentId || 'N/A',
      'Course Code': p.course?.courseCode || 'N/A',
      'Course Name': p.course?.name || 'N/A',
      'Amount': p.amount,
      'Payment Method': p.paymentMethodDisplay || p.paymentMethod,
      'Purpose': p.paymentForDisplay || p.paymentFor,
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